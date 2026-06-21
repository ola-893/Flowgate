/**
 * Custom HTTP transport for the Sui JSON-RPC client.
 *
 * Node.js 24.14.1 has a fundamental networking bug on macOS where outbound
 * HTTPS connections via `node:https`, `globalThis.fetch`, and `undici` all
 * time out with UND_ERR_CONNECT_TIMEOUT or ECONNRESET. Meanwhile `curl`
 * (which uses Apple's Network.framework / LibreSSL) connects fine.
 *
 * This transport prefers `curl` when it is available, but falls back to
 * native fetch on hosts where curl is not installed. It also rotates through
 * every configured RPC URL before surfacing a request failure.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { JsonRpcTransport, JsonRpcTransportRequestOptions } from '@mysten/sui/jsonRpc';

const execFileAsync = promisify(execFile);

interface CurlTransportOptions {
  forceIpv4?: boolean;
  maxAttempts?: number;
}

export class CurlTransport implements JsonRpcTransport {
  #urls: string[];
  #forceIpv4: boolean;
  #maxAttempts: number;
  #activeUrlIndex = 0;
  #curlAvailable: boolean;

  constructor(urls: string | string[], options: CurlTransportOptions = {}) {
    this.#urls = Array.isArray(urls) ? urls : [urls];
    this.#forceIpv4 = options.forceIpv4 ?? process.env.SUI_RPC_FORCE_IPV4 === 'true';
    this.#maxAttempts = options.maxAttempts ?? 2;
    this.#curlAvailable = process.env.SUI_RPC_DISABLE_CURL !== 'true';
  }

  async request<T = unknown>(input: JsonRpcTransportRequestOptions): Promise<T> {
    const body = JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: input.method,
      params: input.params,
    });

    const errors: string[] = [];

    for (let attempt = 1; attempt <= this.#maxAttempts; attempt++) {
      for (let offset = 0; offset < this.#urls.length; offset++) {
        const urlIndex = (this.#activeUrlIndex + offset) % this.#urls.length;
        const url = this.#urls[urlIndex];
        try {
          const stdout = await this.#requestOnce(url, input, body);
          const data = JSON.parse(stdout);

          if (data.error) {
            throw new Error(`RPC Error ${data.error.code}: ${data.error.message}`);
          }

          if (process.env.SUI_RPC_DEBUG === 'true' && (attempt > 1 || urlIndex !== this.#activeUrlIndex)) {
            console.warn(`[sui-rpc] ${input.method} recovered via ${url}`);
          }
          this.#activeUrlIndex = urlIndex;

          return data.result as T;
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          errors.push(`${url}: ${message}`);
          if (process.env.SUI_RPC_DEBUG === 'true') {
            console.warn(`[sui-rpc] ${input.method} failed on ${url} (attempt ${attempt}/${this.#maxAttempts}): ${message}`);
          }
        }
      }
    }

    throw new Error(`All Sui RPC endpoints failed for ${input.method}: ${errors.join(' | ')}`);
  }

  async #requestOnce(url: string, input: JsonRpcTransportRequestOptions, body: string): Promise<string> {
    if (!this.#curlAvailable) {
      return this.#requestWithFetch(url, input, body);
    }

    try {
      return await this.#requestWithCurl(url, input, body);
    } catch (error) {
      if (isCurlMissing(error)) {
        this.#curlAvailable = false;
        return this.#requestWithFetch(url, input, body);
      }

      throw error;
    }
  }

  async #requestWithCurl(url: string, input: JsonRpcTransportRequestOptions, body: string): Promise<string> {
    const args = [
      '--silent',
      '--show-error',
      '--connect-timeout', process.env.SUI_RPC_CONNECT_TIMEOUT_SECONDS || '10',
      '--max-time', process.env.SUI_RPC_MAX_TIME_SECONDS || '25',
      '--header', 'Content-Type: application/json',
      '--header', 'Client-Sdk-Type: typescript',
      '--header', `Client-Request-Method: ${input.method}`,
      '--data', body,
      url,
    ];

    if (this.#forceIpv4) {
      args.splice(6, 0, '--ipv4');
    }

    const { stdout } = await execFileAsync('curl', args, {
      maxBuffer: 10 * 1024 * 1024,
      signal: input.signal,
    });

    return stdout;
  }

  async #requestWithFetch(url: string, input: JsonRpcTransportRequestOptions, body: string): Promise<string> {
    const controller = input.signal ? undefined : new AbortController();
    const timeoutMs = Number(process.env.SUI_RPC_MAX_TIME_SECONDS || '25') * 1000;
    const timeout = controller
      ? setTimeout(() => controller.abort(), timeoutMs)
      : undefined;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Client-Sdk-Type': 'typescript',
          'Client-Request-Method': input.method,
        },
        body,
        signal: input.signal ?? controller?.signal,
      });

      const text = await response.text();
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${text.slice(0, 500)}`);
      }

      return text;
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  }
}

function isCurlMissing(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const code = 'code' in error ? String(error.code) : '';
  const message = error instanceof Error ? error.message : String(error);
  return code === 'ENOENT' || message.includes('spawn curl ENOENT');
}
