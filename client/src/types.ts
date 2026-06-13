/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum PAGE {
  LANDING = "LANDING",
  DIRECTORY = "DIRECTORY",
  REGISTER = "REGISTER",
  PROVIDER_CONSOLE = "PROVIDER_CONSOLE",
  NODE_DETAIL = "NODE_DETAIL",
  OPERATOR_CONSOLE = "OPERATOR_CONSOLE",
  DEV_PORTAL = "DEV_PORTAL",
  LIVE_TERMINAL = "LIVE_TERMINAL"
}

export type EndpointType = "stream" | "compute" | "api";
export type EndpointStatus = "active" | "synced" | "degraded" | "offline";

export interface Endpoint {
  id: string;
  name: string;
  type: EndpointType;
  status: EndpointStatus;
  price: number; 
  unit: string; // e.g., "1K Ticks", "1M Tokens", "min", "inference step", "sec of speech"
  dataProvider: string;
  latency: number; // in ms
  throughput: string; // e.g., "45 MB/s"
  rating: number; // e.g., 4.95
  uptime: number; // percentage, e.g. 99.98
  description: string;
  endpointUrl: string;
  inputs: string[];
  outputs: string[];
  apiKeyRequired: boolean;
  totalRequests: number;
  activeConsumers: number;
  gasSui: number;
  hardwareSpecs?: string;
  location?: string;
}

export interface PaymentLog {
  id: string;
  timestamp: string;
  endpointId: string;
  endpointName: string;
  amount: number; // in SUI
  status: "completed" | "pending" | "failed";
  consumer: string;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  purpose: string;
  selectedEndpoints: string[];
  maxBudgetSui: number;
  currentSpendSui: number;
  autoRefill: boolean;
  scrapeInterval: string;
  status: "active" | "paused" | "depleted";
  createdAt: string;
  totalRequests: number;
}

export interface ConsumerMetric {
  id: string;
  clientAddress: string;
  activeStreams: number;
  accumulatedSui: number;
  lastPaymentTime: string;
  burnRate: number; // SUI per second or minute
}
