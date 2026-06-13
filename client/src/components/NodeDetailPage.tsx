import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Endpoint } from "../types";
import { 
  ArrowLeft, 
  Globe, 
  Copy, 
  Check, 
  Play, 
  ChevronRight
} from "lucide-react";

interface NodeDetailPageProps {
  selectedEndpoint?: Endpoint;
}

export default function NodeDetailPage({ selectedEndpoint }: NodeDetailPageProps) {
  const navigate = useNavigate();
  // If no endpoint is parsed, fallback to a majestic default Valerian-9 GPU structure
  const ep = selectedEndpoint || {
    id: "valerian-9-compute",
    name: "VALERIAN_9_COMPUTE",
    type: "compute" as const,
    status: "active" as const,
    price: 0.08,
    unit: "inference step",
    dataProvider: "Valerian Grid",
    latency: 64,
    throughput: "1.2 GB/s",
    rating: 4.99,
    uptime: 99.99,
    description: "High-performance GPU-bound inference endpoint for vision models and agent execution. Deployed securely on an edge mesh backed by enterprise clusters.",
    endpointUrl: "https://node.valerian.io/v1/inference",
    inputs: ["prompt", "image_tensor", "temperature"],
    outputs: ["prediction_logits", "latency_report"],
    apiKeyRequired: true,
    totalRequests: 894042,
    activeConsumers: 14,
    gasSui: 0.02
  };

  const [activeCodeLang, setActiveCodeLang] = useState<"js" | "python" | "curl">("js");
  const [copied, setCopied] = useState(false);

  // Playground state
  const [promptInput, setPromptInput] = useState("SELECT * FROM realtime_orderbook WHERE volume > 10000;");
  const [isPlaying, setIsPlaying] = useState(false);
  const [sandboxResponse, setSandboxResponse] = useState<string>("");

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const codeSnippets = {
    js: `import { Flowgate } from "@flowgate/sdk";

const client = new Flowgate({
  nodeAddress: "sui:node_addr_901c...fa21",
  gasBudgetSui: 5.0
});

// Setup continuous payment session
const session = await client.openChannel({
  endpoint: "${ep.name}",
  priceScalar: ${ep.price}
});

const response = await session.query({
  prompt: "${promptInput.replace(/"/g, '\\"')}"
});

session.on("stream_chunk", (chunk) => {
  console.log("Inbound telemetry chunk:", chunk.data);
});`,
    python: `from flowgate import FlowgateClient

client = FlowgateClient(
    node_address="sui:node_addr_901c...fa21",
    gas_budget_sui=5.0
)

# Initialize micro-settled gateway connection
session = client.open_channel(
    endpoint="${ep.name}",
    price_scalar=${ep.price}
)

response = session.query(
    prompt="${promptInput}"
)

for chunk in response.stream():
    print(f"Inbound telemetry chunk: {chunk.data}")`,
    curl: `curl -X POST "${ep.endpointUrl}" \\
  -H "Authorization: Bearer SUI_ESCROW_CHANNEL_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "endpoint": "${ep.name}",
    "prompt": "${promptInput}"
  }'`
  };

  const handleRunPlayground = () => {
    setIsPlaying(true);
    setSandboxResponse("");
    
    setTimeout(() => {
      const mockResult = {
        status: "SUCCESS_DECRYPT_OK",
        timestamp_sui: Math.floor(Date.now() / 1000),
        latency_ms: ep.latency + Math.floor(Math.random() * 8 - 4),
        routing_nodes: ["sui:node_901c", "sui:route_a1a2", "sui:node_ff4d"],
        payload: {
          schema: "dynamic_array",
          records: [
            { id: "tx-491", stream_volume: 12480, sui_multiplier: ep.price, metadata: "Secure routing block" },
            { id: "tx-492", stream_volume: 15990, sui_multiplier: ep.price, metadata: "Compute complete" }
          ],
          agg_sui_settled: (ep.price * 2).toFixed(6)
        }
      };
      setSandboxResponse(JSON.stringify(mockResult, null, 2));
      setIsPlaying(false);
    }, 1500);
  };

  return (
    <div className="pb-16">
      
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-sans text-stone-500 mb-6">
        <span onClick={() => navigate("/")} className="hover:text-black cursor-pointer transition-colors font-semibold">Flowgate</span>
        <span>/</span>
        <span onClick={() => navigate("/directory")} className="hover:text-black cursor-pointer transition-colors">Browse Data</span>
        <span>/</span>
        <span className="text-stone-400">{ep.name}</span>
      </div>

      {/* Flag Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8 border-b border-stone-300 pb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate("/directory")}
            className="p-2.5 border border-stone-300 bg-white hover:bg-stone-50 hover:border-[#1C1A17] transition-all rounded-full flex items-center justify-center shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-stone-700" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-sans text-3xl font-bold text-[#1C1A17]">
                {ep.name}
              </h1>
              <span className="px-2 py-0.5 border border-stone-300 text-xs font-sans text-stone-500 font-medium">
                {ep.type} node
              </span>
              <span className="px-2 py-0.5 border border-emerald-300 bg-emerald-50 text-xs font-sans text-emerald-800 font-medium">
                99.99% uptime
              </span>
            </div>
            <p className="text-sm font-sans text-stone-500 mt-0.5">Published by: {ep.dataProvider}</p>
          </div>
        </div>

        <div className="px-4 py-2 border border-stone-200 bg-white font-mono text-xs select-none">
          <span className="text-xs font-sans text-stone-400 block">Cost per {ep.unit}</span>
          <span className="text-base font-sans font-bold text-[#1C1A17]">
            {ep.price.toFixed(4)} SUI
          </span>
        </div>
      </div>

      {/* CORE GRID layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        
        {/* Left Side: Hardware specs and details */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          <div className="border border-stone-200 bg-white p-5 shadow-sm flex flex-col gap-4">
            <span className="text-xs font-sans text-[#8C2C16] font-semibold">Hardware Specs</span>
            
            <div className="flex flex-col gap-3 font-mono text-[11px]">
              <div className="flex justify-between py-1.5 border-b border-stone-150">
                <span className="text-stone-400 text-xs font-sans">GPU</span>
                <span className="text-[#1C1A17] font-semibold text-sm font-sans">8x NVIDIA H100 PCIe</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-stone-150">
                <span className="text-stone-400 text-xs font-sans">Memory</span>
                <span className="text-[#1C1A17] font-semibold text-sm font-sans">640 GB SXM5</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-stone-150">
                <span className="text-stone-400 text-xs font-sans">Latency</span>
                <span className="text-[#8C2C16] font-bold text-sm font-sans">{ep.latency}ms avg</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-stone-150">
                <span className="text-stone-400 text-xs font-sans">Location</span>
                <span className="text-[#1C1A17] flex items-center gap-1 text-sm font-sans">
                  <Globe className="w-3 h-3 text-stone-500" />
                  US-EAST (VIRGINIA)
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-stone-150">
                <span className="text-stone-400 text-xs font-sans">On-chain address</span>
                <span className="text-stone-600 select-all truncate text-right max-w-[150px] text-sm font-sans" title="sui:node_addr_901c8af01cb299fa21">
                  sui:node_addr_901c...fa21
                </span>
              </div>
            </div>

            <p className="text-sm text-stone-500 font-sans leading-relaxed pt-2 border-t border-stone-100">
              {ep.description}
            </p>
          </div>

          {/* Historical health bars block */}
          <div className="border border-stone-200 bg-white p-5 shadow-sm flex flex-col gap-3">
            <div className="flex justify-between items-center pb-2 border-b border-stone-100">
              <span className="text-xs font-sans text-stone-700 font-medium">Uptime History</span>
              <span className="text-xs font-sans px-2 py-0.5 border border-emerald-300 text-emerald-800 bg-emerald-50 font-bold">99.99%</span>
            </div>

            <div className="grid grid-cols-12 gap-1 py-1">
              {Array.from({ length: 24 }).map((_, i) => (
                <div 
                  key={i} 
                  className="h-7 bg-stone-100 border border-stone-200 group relative cursor-help flex items-end"
                  title={`Block -${24 - i}h: 100.0% operational`}
                >
                  <div className="w-full h-[95%] bg-[#8C2C16]" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-[#1C1A17] text-[8px] font-mono text-white px-1.5 py-0.5 rounded-none whitespace-nowrap z-10">
                    100.0% operational
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between text-xs font-sans text-stone-400">
              <span>Last 24 hours</span>
              <span>All systems operational</span>
            </div>
          </div>

        </div>

        {/* Right Side: Sandbox and client implementation specs */}
        <div className="lg:col-span-8 border border-stone-200 bg-white p-6 shadow-sm flex flex-col gap-6">
          
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-stone-200 pb-3">
              <div>
                <h2 className="font-sans font-semibold text-[#1C1A17] text-lg">Integration Guide</h2>
                <p className="text-sm font-sans text-stone-500">Use the SDK or direct API to connect</p>
              </div>

              {/* Lang toggle tabs */}
              <div className="flex items-center gap-1 bg-stone-100 border border-stone-200 p-1 rounded-full">
                {[
                  { id: "js", label: "JavaScript" },
                  { id: "python", label: "Python" },
                  { id: "curl", label: "cURL" }
                ].map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setActiveCodeLang(l.id as any)}
                    className={`px-3 py-1.5 font-sans text-xs transition-all rounded-full cursor-pointer ${
                      activeCodeLang === l.id 
                        ? "bg-white text-black font-bold border border-stone-300 shadow-sm" 
                        : "text-stone-500 hover:text-black"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Code Block Container */}
            <div className="relative border border-stone-250 bg-stone-50 overflow-hidden">
              <button 
                onClick={() => handleCopyCode(codeSnippets[activeCodeLang])}
                className="absolute right-3.5 top-3.5 px-3 py-1 text-xs font-sans bg-white border border-stone-300 text-stone-700 hover:text-black hover:border-[#1C1A17] transition-all rounded-full shadow-sm"
                title="Copy code"
              >
                {copied ? "Copied!" : "Copy"}
              </button>

              <pre className="p-5 overflow-x-auto text-[12px] font-mono text-stone-800 leading-relaxed max-h-[220px] custom-scrollbar selection:bg-stone-200">
                <code>{codeSnippets[activeCodeLang]}</code>
              </pre>
            </div>
          </div>

          {/* Interactive Playground Section */}
          <div className="border-t border-stone-200 pt-6 mt-2 flex flex-col gap-4">
            <div>
              <h3 className="font-sans font-semibold text-[#1C1A17] text-lg">Try It Out</h3>
              <p className="text-sm font-sans text-stone-500">Send a test query to this endpoint</p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <input 
                  type="text" 
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  placeholder="Enter your query..."
                  className="flex-1 bg-white border border-stone-300 focus:border-[#1C1A17] outline-none px-4 py-3 text-sm font-sans text-[#1C1A17] rounded-full placeholder:text-stone-400"
                />
                <button 
                  onClick={handleRunPlayground}
                  disabled={isPlaying || !promptInput.trim()}
                  className="px-5 py-3 bg-[#1C1A17] hover:bg-[#2E2E38] disabled:opacity-50 text-[#FAF9F5] font-sans text-sm font-bold rounded-full transition-all flex items-center justify-center gap-2 shrink-0 shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
                >
                  {isPlaying ? (
                    <>
                      <span className="w-3 h-3 rounded-full border border-white/25 border-t-white animate-spin" />
                      Streaming...
                    </>
                  ) : (
                    <>
                      Send Query
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Streaming Output Display */}
              {sandboxResponse && (
                <div className="p-5 border border-stone-250 bg-[#FAF9F5] relative">
                  <span className="absolute top-3 right-4 text-xs font-sans text-emerald-800 font-medium border border-emerald-300 bg-emerald-50 px-2 py-0.5 rounded-full">Settled</span>
                  <pre className="text-[12px] font-mono text-stone-800 overflow-x-auto leading-relaxed max-h-[160px] custom-scrollbar">
                    <code>{sandboxResponse}</code>
                  </pre>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
