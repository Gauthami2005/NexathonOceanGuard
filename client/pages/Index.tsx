import { Button } from "@/components/ui/button";
import Footer from "@/components/layout/Footer";
import { Waves, AlertTriangle, Tornado, Activity } from "lucide-react";
import AlertCard, { type AlertItem, type AlertType } from "@/components/AlertCard";
import OceanMap, { type MapMarker } from "@/components/OceanMap";
import { Link } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";

type Hazard = {
  id: string;
  type: string;
  severity: "info" | "warning" | "critical";
  pincode: string;
  location: string;
  reportedAt: string;
  description: string;
  status: "open" | "acknowledged" | "resolved";
};

export default function Index() {
  const [hazards, setHazards] = useState<Hazard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get user's pincode from localStorage
  const [userPincode] = useState<string | null>(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("user") : null;
      if (raw) {
        const user = JSON.parse(raw);
        return user?.location?.pincode || null;
      }
    } catch (err) {
      // ignore storage errors
    }
    return null;
  });

  // Fetch hazards from API
  useEffect(() => {
    let isMounted = true;
    async function fetchHazards() {
      try {
        setIsLoading(true);
        setError(null);
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const url = new URL("http://localhost:3001/api/reports/real");
        url.searchParams.append("minConfidence", "0.8");

        // Filter by user's pincode if available
        if (userPincode) {
          url.searchParams.append("pincode", userPincode);
        }

        const res = await fetch(url.toString(), {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
        });

        if (!res.ok) throw new Error(`Failed to load hazards (${res.status})`);

        const reports: any[] = await res.json();
        if (!Array.isArray(reports)) throw new Error("Invalid hazards response");

        const toSeverity = (confidence?: number): Hazard["severity"] => {
          if (typeof confidence === "number") {
            if (confidence >= 0.9) return "critical";
            if (confidence >= 0.85) return "warning";
          }
          return "info";
        };

        const normalized: Hazard[] = reports.map((it: any) => ({
          id: String(it.id ?? ""),
          type: String(it.type ?? it.category ?? "Unknown"),
          severity: toSeverity(it?.ai?.confidence),
          pincode: String(it.pincode ?? "Unknown"),
          location: String(it.location ?? "Unknown"),
          description: String(it.description ?? "No description available"),
          reportedAt: String(it.createdAt ?? new Date().toISOString()),
          status: String(it.status ?? "open").toLowerCase() as Hazard["status"],
        }));

        if (isMounted) setHazards(normalized);
      } catch (e: any) {
        if (isMounted) setError(e?.message ?? "Error loading hazards");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    fetchHazards();
    return () => { isMounted = false; };
  }, [userPincode]);

  // Generate map markers from hazards
  const markers: MapMarker[] = useMemo(() => {
    const pincodeCoords: Record<string, [number, number]> = {
      "576213": [13.3409, 74.7421], // Example
      "575003": [13.3409, 74.7421],
      "400001": [18.9647, 72.8329],
      "700001": [22.5726, 88.3639],
      "600001": [13.0827, 80.2707],
      "682001": [9.9312, 76.2673],
      "403001": [15.4909, 73.8278],
      "530001": [17.6868, 83.2185],
      "628001": [8.7642, 78.1348],
    };

    return hazards
      .filter(h => h.status !== "resolved" && h.pincode && pincodeCoords[h.pincode])
      .map(h => ({
        id: h.id,
        position: pincodeCoords[h.pincode],
        title: `${h.type} (${h.pincode})`,
        type: (h.type as unknown) as AlertType,
      }));
  }, [hazards]);

  // Convert hazards to alert items for the AlertCard component
  const alerts: AlertItem[] = useMemo(() => {
    return hazards
      .filter(h => h.status !== "resolved")
      .map(h => ({
        id: h.id,
        type: (h.type as unknown) as AlertType,
        severity: h.severity,
        location: `Pincode: ${h.pincode}`,
        time: new Date(h.reportedAt).toLocaleString(),
        description: h.description,
      }));
  }, [hazards]);

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="overflow-hidden rounded-2xl border border-[#1a2332] bg-gradient-to-br from-[#0f1625] via-[#1a2332] to-[#0f1625] p-6 md:p-10">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-400 shadow-sm shadow-cyan-500/20">
              <Waves className="h-4 w-4" /> Ocean Guard
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl text-white">
              Stay Alert. Stay Safe.
            </h1>
            <p className="text-gray-400 max-w-prose">
              Live disaster alerts, community reporting, and an interactive map to help you navigate emergencies with confidence.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="px-6 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white border-0">
                <Link to="/community"><AlertTriangle className="mr-2" /> Report an Incident</Link>
              </Button>
              <Button asChild variant="outline" className="px-6 border-[#1a2332] text-white hover:bg-[#1a2332]">
                <Link to="/alerts">View Live Alerts</Link>
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 rounded-full bg-cyan-500/10 blur-3xl" />
            <div className="relative grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-[#1a2332] bg-[#0f1625] p-4 shadow-sm">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-sky-500/20 text-sky-400">
                  <Tornado className="h-5 w-5" />
                </div>
                <p className="mt-3 text-sm font-semibold text-white">Cyclone Watch</p>
                <p className="text-xs text-gray-400">Bay of Bengal</p>
              </div>
              <div className="rounded-xl border border-[#1a2332] bg-[#0f1625] p-4 shadow-sm">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-red-500/20 text-red-400">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <p className="mt-3 text-sm font-semibold text-white">Flood Warning</p>
                <p className="text-xs text-gray-400">Kochi, IN</p>
              </div>
              <div className="rounded-xl border border-[#1a2332] bg-[#0f1625] p-4 shadow-sm">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-amber-500/20 text-amber-400">
                  <Activity className="h-5 w-5" />
                </div>
                <p className="mt-3 text-sm font-semibold text-white">Tremors</p>
                <p className="text-xs text-gray-400">Gujarat</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Alerts + Map */}
      <section className="grid gap-8 md:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">Live Alert Feed</h2>
            <p className="text-sm text-gray-400">Realtime updates from trusted sources and the community.</p>
          </div>
          <div className="grid gap-3">
              {isLoading ? (
                <div className="text-sm text-muted-foreground p-4 border border-[#1a2332] rounded-xl">
                  Loading alerts...
                </div>
              ) : error ? (
                <div className="text-sm text-red-500 p-4 border border-[#1a2332] rounded-xl">
                  {error}
                </div>
              ) : alerts.length === 0 ? (
                <div className="text-sm text-muted-foreground p-4 border border-[#1a2332] rounded-xl">
                  No active alerts in your area
                </div>
              ) : (
                alerts.map((a: AlertItem) => (
              <AlertCard key={a.id} item={a} />
                ))
              )}
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-white">Interactive Map</h2>
            <Button asChild variant="outline" size="sm" className="border-[#1a2332] text-white hover:bg-[#1a2332]">
              <Link to="/community">Add Marker via Report</Link>
            </Button>
          </div>
            <OceanMap markers={markers} center={[20.5937, 78.9629]} zoom={4} />
        </div>
      </section>
      {/* Page Footer: now inside scrollable content */}
      <Footer />
    </div>
  );
}