import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Endpoint, EndpointType } from "../types";
import {
  Search,
  Plus,
  ChevronRight
} from "lucide-react";

interface DirectoryPageProps {
  endpoints: Endpoint[];
  onSelectEndpoint: (endpoint: Endpoint) => void;
}

export default function DirectoryPage({ endpoints, onSelectEndpoint }: DirectoryPageProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<EndpointType | "all">("all");

  const filteredEndpoints = endpoints.filter((ep) => {
    const matchesSearch = ep.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ep.dataProvider.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ep.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || ep.type === selectedType;
    return matchesSearch && matchesType;
  });

  const getTypeLabel = (type: EndpointType) => {
    switch (type) { case "stream": return "Stream Feed"; case "compute": return "Compute"; case "api": return "API"; }
  };

  const getTypeColor = (type: EndpointType) => {
    switch (type) { case "stream": return "text-[#8C2C16] border-[#8C2C16]/20 bg-[#8C2C16]/5"; case "compute": return "text-amber-800 border-amber-800/20 bg-amber-800/5"; case "api": return "text-emerald-850 border-emerald-850/20 bg-emerald-850/5"; }
  };

  const getStatusBadge = (status: Endpoint["status"]) => {
    switch (status) {
      case "active": return <span className="px-2 py-0.5 border border-emerald-300 text-emerald-800 bg-emerald-50 text-xs font-sans font-bold">Active</span>;
      case "synced": return <span className="px-2 py-0.5 border border-blue-300 text-blue-800 bg-blue-50 text-xs font-sans font-bold">Synced</span>;
      case "degraded": return <span className="px-2 py-0.5 border border-amber-300 text-amber-800 bg-amber-50 text-xs font-sans font-bold">Degraded</span>;
      case "offline": return <span className="px-2 py-0.5 border border-stone-300 text-stone-500 bg-stone-100 text-xs font-sans font-bold">Offline</span>;
    }
  };

  return (
    <div className="pb-16">
      <div className="flex items-center gap-2 text-xs font-sans text-stone-500 mb-6">
        <span onClick={() => navigate("/")} className="hover:text-black cursor-pointer transition-colors font-semibold">Flowgate</span>
        <span>/</span>
        <span className="text-stone-400">Browse Data</span>
      </div>

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-10 border-b border-stone-300/80 pb-6">
        <div>
          <h1 className="font-sans text-3xl font-bold text-[#1C1A17]">Browse Data Sources</h1>
          <p className="text-sm text-stone-500 mt-1">Find and connect to verified datasets, compute nodes, and APIs.</p>
        </div>
        <button onClick={() => navigate("/register")} className="px-5 py-2.5 bg-[#8C2C16] hover:bg-[#A63A23] text-white rounded-full text-sm font-sans font-bold transition-all flex items-center gap-2 shadow-md hover:shadow-lg active:scale-95 cursor-pointer shrink-0">
          <Plus className="w-4 h-4" />Register New Endpoint
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8 border-b border-stone-200 pb-8">
        <div className="lg:col-span-7 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input type="text" placeholder="Search by name, provider, or description..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full text-sm font-sans bg-white border border-stone-300 focus:border-stone-800 text-[#1C1A17] rounded-full pl-10 pr-4 py-3 outline-none transition-all placeholder:text-stone-400" />
        </div>
        <div className="lg:col-span-5 flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 justify-start lg:justify-end">
          <span className="text-xs font-sans text-stone-400 mr-1 shrink-0 font-medium">Filters:</span>
          {[{ id: "all", label: "All" }, { id: "stream", label: "Feeds" }, { id: "compute", label: "Compute" }, { id: "api", label: "APIs" }].map((item) => (
            <button key={item.id} onClick={() => setSelectedType(item.id as any)} className={`px-3.5 py-1.5 rounded-full font-sans text-xs transition-all border shrink-0 ${selectedType === item.id ? "bg-[#1C1A17] text-[#E5E5ED] border-[#1C1A17] font-bold" : "bg-white text-stone-600 border-stone-250 hover:bg-stone-50"}`}>{item.label}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
        <div className="p-4 border border-stone-200 bg-white rounded-xl"><span className="text-xs font-sans text-stone-400 block">Active Endpoints</span><span className="font-sans text-2xl font-bold text-[#1C1A17] mt-1 block">{endpoints.length} Active</span></div>
        <div className="p-4 border border-stone-200 bg-white rounded-xl"><span className="text-xs font-sans text-stone-400 block">Avg Latency</span><span className="font-sans text-2xl font-bold text-[#1C1A17] mt-1 block">42 ms</span></div>
        <div className="p-4 border border-stone-200 bg-white rounded-xl"><span className="text-xs font-sans text-stone-400 block">Total Escrow</span><span className="font-sans text-2xl font-bold text-[#9C3C26] mt-1 block">1.48M SUI</span></div>
        <div className="p-4 border border-stone-200 bg-white rounded-xl"><span className="text-xs font-sans text-stone-400 block">Uptime</span><span className="font-sans text-2xl font-bold text-[#1C1A17] mt-1 block">100% Optimal</span></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {filteredEndpoints.length > 0 ? (
          filteredEndpoints.map((ep) => (
            <div key={ep.id} onClick={() => onSelectEndpoint(ep)} className="group border border-stone-205 hover:border-[#1C1A17] bg-white rounded-none p-6 flex flex-col gap-5 justify-between transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md relative">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 border text-[10px] font-sans font-semibold ${getTypeColor(ep.type)}`}>{getTypeLabel(ep.type)}</span>
                    <span className="text-xs font-sans text-stone-400">{ep.dataProvider}</span>
                  </div>
                  <h3 className="font-sans font-bold text-xl text-[#1C1A17] group-hover:text-[#8C2C16] transition-colors mt-1">{ep.name}</h3>
                </div>
                {getStatusBadge(ep.status)}
              </div>
              <p className="text-sm text-stone-600 font-sans leading-relaxed line-clamp-3">{ep.description}</p>
              <div className="grid grid-cols-3 gap-3 py-3 border-y border-stone-200 text-sm font-sans">
                <div><span className="text-xs text-stone-400 block">Latency</span><span className="text-[#1C1A17] font-bold">{ep.latency}ms</span></div>
                <div><span className="text-xs text-stone-400 block">Throughput</span><span className="text-[#1C1A17] font-bold">{ep.throughput}</span></div>
                <div><span className="text-xs text-stone-400 block">Uptime</span><span className="text-emerald-700 font-bold">{ep.uptime}%</span></div>
              </div>
              <div className="flex items-center justify-between text-sm font-sans pt-1">
                <div className="flex flex-col">
                  <span className="text-xs text-stone-400">Cost per {ep.unit}</span>
                  <span className="text-base font-sans font-bold text-[#1C1A17]">{ep.price.toFixed(4)} SUI</span>
                </div>
                <span className="text-sm font-sans text-[#8C2C16] group-hover:translate-x-1 transition-transform flex items-center gap-1 font-bold">
                  View Details <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="md:col-span-2 py-16 text-center border-2 border-dashed border-stone-250 bg-white">
            <p className="text-sm font-sans text-stone-400">No results match your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
