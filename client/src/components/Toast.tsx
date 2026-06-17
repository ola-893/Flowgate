import React, { useEffect, useState } from "react";
import { Check, X as XIcon, AlertTriangle, Info } from "lucide-react";

export type ToastVariant = "success" | "error" | "info" | "warning";

export interface ToastData {
  id: string;
  variant: ToastVariant;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastItemProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

const variantConfig: Record<
  ToastVariant,
  { bg: string; border: string; icon: React.ReactNode; iconBg: string; accentText: string }
> = {
  success: {
    bg: "bg-[#FAF9F5]",
    border: "border-emerald-300",
    icon: <Check className="w-4 h-4 text-emerald-800" strokeWidth={2.5} />,
    iconBg: "bg-emerald-100",
    accentText: "text-emerald-900",
  },
  error: {
    bg: "bg-[#FAF9F5]",
    border: "border-[#8C2C16]/30",
    icon: <AlertTriangle className="w-4 h-4 text-[#8C2C16]" strokeWidth={2.5} />,
    iconBg: "bg-[#8C2C16]/10",
    accentText: "text-[#8C2C16]",
  },
  info: {
    bg: "bg-[#FAF9F5]",
    border: "border-stone-300",
    icon: <Info className="w-4 h-4 text-stone-600" strokeWidth={2.5} />,
    iconBg: "bg-stone-100",
    accentText: "text-stone-800",
  },
  warning: {
    bg: "bg-[#FAF9F5]",
    border: "border-amber-300",
    icon: <AlertTriangle className="w-4 h-4 text-amber-700" strokeWidth={2.5} />,
    iconBg: "bg-amber-100",
    accentText: "text-amber-900",
  },
};

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const config = variantConfig[toast.variant];

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setVisible(true));

    const duration = toast.duration ?? 4000;
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onDismiss(toast.id), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <div
      className={`
        ${config.bg} ${config.border}
        border shadow-lg shadow-black/5
        flex items-start gap-3 p-4 pr-3
        w-full max-w-sm
        transition-all duration-300 ease-out
        ${visible && !exiting ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
      `}
    >
      {/* Icon badge */}
      <div className={`shrink-0 w-7 h-7 flex items-center justify-center rounded-full ${config.iconBg}`}>
        {config.icon}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0 pt-0.5">
        <p className={`text-sm font-sans font-bold ${config.accentText} leading-tight`}>
          {toast.title}
        </p>
        {toast.message && (
          <p className="text-xs font-sans text-stone-500 mt-1 leading-relaxed">
            {toast.message}
          </p>
        )}
      </div>

      {/* Dismiss */}
      <button
        onClick={() => {
          setExiting(true);
          setTimeout(() => onDismiss(toast.id), 300);
        }}
        className="shrink-0 p-1 text-stone-300 hover:text-stone-600 transition-colors cursor-pointer"
      >
        <XIcon className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export { ToastItem };
