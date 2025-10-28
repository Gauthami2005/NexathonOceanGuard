import { cn } from "@/lib/utils";
import { AlertTriangle, Waves, Activity, Tornado } from "lucide-react";

export type AlertType = "Flood" | "Earthquake" | "Cyclone" | "Tsunami" | "Other";

export interface AlertItem {
  id: string;
  type: AlertType;
  severity: "info" | "warning" | "critical";
  location: string;
  time: string; // ISO or human-readable
  description: string;
}

const typeIcon = (type: AlertType) => {
  switch (type) {
    case "Flood":
    case "Tsunami":
      return Waves;
    case "Earthquake":
      return Activity;
    case "Cyclone":
      return Tornado;
    default:
      return AlertTriangle;
  }
};

const severityClasses: Record<AlertItem["severity"], string> = {
  info: "bg-sky-500/20 text-sky-400 ring-sky-500/30",
  warning: "bg-amber-500/20 text-amber-400 ring-amber-500/30",
  critical: "bg-red-500/20 text-red-400 ring-red-500/30",
};

export default function AlertCard({ item }: { item: AlertItem }) {
  const Icon = typeIcon(item.type);
  return (
    <div className={cn(
      "rounded-lg border border-[#1a2332] bg-[#0f1625] p-4 shadow-sm transition hover:shadow-lg hover:shadow-cyan-500/10",
      "ring-1 ring-inset",
      item.severity === "critical" ? "ring-red-500/30" : item.severity === "warning" ? "ring-amber-500/30" : "ring-sky-500/30",
    )}>
      <div className="flex items-start gap-3">
        <div className={cn("mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-md", severityClasses[item.severity])}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="grid gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-white">{item.type}</p>
            <span className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border",
              item.severity === "critical" ? "bg-red-500/20 text-red-400 border-red-500/30" : item.severity === "warning" ? "bg-amber-500/20 text-amber-400 border-amber-500/30" : "bg-sky-500/20 text-sky-400 border-sky-500/30",
            )}>
              {item.severity.toUpperCase()}
            </span>
            <span className="text-xs text-gray-400">{item.time}</span>
          </div>
          <p className="text-sm text-gray-400 leading-snug">{item.description}</p>
          <p className="text-sm text-white"><span className="text-gray-400">Location:</span> {item.location}</p>
        </div>
      </div>
    </div>
  );
}
