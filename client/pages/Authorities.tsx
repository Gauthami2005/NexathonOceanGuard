import { Shield, Siren, Users, Map, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import OceanMap, { type MapMarker } from "@/components/OceanMap";
import type { AlertType } from "@/components/AlertCard";

type Incident = {
  id: string;
  type: string;
  // Normalize to lowercase internally
  severity: "info" | "warning" | "critical";
  location: string;
  pincode: string;
  reportedAt: string; // ISO string
  status: "open" | "acknowledged" | "resolved";
};

export default function Authorities() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isMapOpen, setIsMapOpen] = useState<boolean>(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchIncidents() {
      try {
        setIsLoading(true);
        setError(null);
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const res = await fetch("http://localhost:3001/api/reports/real?minConfidence=0.8", {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error(`Failed to load incidents (${res.status})`);
        }
        const reports: any[] = await res.json();
        if (!Array.isArray(reports)) {
          throw new Error("Invalid incidents response");
        }
        const toSeverity = (confidence?: number): Incident["severity"] => {
          if (typeof confidence === "number") {
            if (confidence >= 0.9) return "critical";
            if (confidence >= 0.85) return "warning";
          }
          return "info";
        };
        const normalized: Incident[] = reports.map((it: any) => {
          const statusRaw = String(it.status ?? "open").toLowerCase();
          const status: Incident["status"] =
            statusRaw === "acknowledged" ? "acknowledged" : statusRaw === "resolved" ? "resolved" : "open";
          return {
            id: String(it.id ?? ""),
            type: String(it.type ?? it.category ?? "Unknown"),
            severity: toSeverity(it?.ai?.confidence),
            location: String(it.location ?? "Unknown"),
            pincode: String(it.pincode ?? "Unknown"),
            reportedAt: String(it.createdAt ?? new Date().toISOString()),
            status,
          } as Incident;
        });
        if (isMounted) setIncidents(normalized);
      } catch (e: any) {
        if (isMounted) setError(e?.message ?? "Error loading incidents");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    fetchIncidents();
    return () => {
      isMounted = false;
    };
  }, []);
  const openDetails = (inc: Incident) => {
    setSelectedIncident(inc);
    setIsDetailsOpen(true);
  };

  const closeDetails = () => {
    setIsDetailsOpen(false);
    setSelectedIncident(null);
  };

  const acknowledgeIncident = () => {
    if (!selectedIncident) return;
    setIncidents((prev) =>
      prev.map((i) => (i.id === selectedIncident.id ? { ...i, status: "acknowledged" } : i))
    );
    closeDetails();
  };

  const resolveIncident = () => {
    if (!selectedIncident) return;
    setIncidents((prev) => prev.map((i) => (i.id === selectedIncident.id ? { ...i, status: "resolved" } : i)));
    closeDetails();
  };

  const stats = useMemo(() => {
    const total = incidents.length;
    const critical = incidents.filter((i) => i.severity === "critical").length;
    const acknowledged = incidents.filter((i) => i.status === "acknowledged").length;
    // Placeholder for resolved in last 24h; here we count all resolved
    const resolved = incidents.filter((i) => i.status === "resolved").length;
    return { total, critical, acknowledged, resolved };
  }, [incidents]);

  // Build map markers from incidents based on their pincodes
  const markers: MapMarker[] = useMemo(() => {
    const allowedTypes: AlertType[] = ["Flood", "Earthquake", "Cyclone", "Tsunami", "Other"];
    const toAlertType = (t: string): AlertType => {
      const normalized = t.trim().toLowerCase();
      const match = allowedTypes.find((x) => x.toLowerCase() === normalized);
      return match ?? "Other";
    };

    // Mapping of pincodes to their approximate coordinates
    const pincodeCoords: Record<string, [number, number]> = {
      "575003": [13.3409, 74.7421], // Udupi
      "400001": [18.9647, 72.8329], // Mumbai
      "700001": [22.5726, 88.3639], // Kolkata
      "600001": [13.0827, 80.2707], // Chennai
      "682001": [9.9312, 76.2673],  // Kochi
      "403001": [15.4909, 73.8278], // Panaji
      "530001": [17.6868, 83.2185], // Visakhapatnam
      "628001": [8.7642, 78.1348],  // Tuticorin
      // Add more pincode coordinates as needed
    };

    // Filter incidents that should be shown on the map:
    // 1. Only show non-resolved incidents
    // 2. Must have a valid pincode that we can map to coordinates
    const displayedIncidents = incidents.filter(inc => 
      inc.status !== "resolved" && // Don't show resolved incidents
      inc.pincode && // Must have a pincode
      pincodeCoords[inc.pincode] // Must be a pincode we can map to coordinates
    );

    return displayedIncidents.map((inc) => {
      const position = pincodeCoords[inc.pincode];
      return {
        id: inc.id,
        position: position,
        title: `${inc.type} (${inc.pincode})`,
        type: toAlertType(inc.type),
      } satisfies MapMarker;
    });
  }, [incidents]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-6 w-6 text-sky-700" /> Authorities Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">Monitor incidents, coordinate response, and manage official updates.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2"><Users className="h-4 w-4" /> Assign Teams</Button>
          <Button className="gap-2"><Siren className="h-4 w-4" /> Issue Alert</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Incidents</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">Across coastal regions</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Critical Severity</CardDescription>
            <CardTitle className="text-3xl">{stats.critical}</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">Immediate attention needed</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Acknowledged</CardDescription>
            <CardTitle className="text-3xl">{stats.acknowledged}</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">Assigned to response teams</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Resolved (24h)</CardDescription>
            <CardTitle className="text-3xl">{stats.resolved}</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">Successfully closed</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Incidents</CardTitle>
              <CardDescription>Incoming reports and automated detections</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setIsMapOpen(true)}
              >
                <Map className="h-4 w-4" /> View Map
              </Button>
              <Button size="sm" className="gap-2"><CheckCircle2 className="h-4 w-4" /> Acknowledge All</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="text-sm text-muted-foreground">Loading incidents…</div>
          )}
          {error && !isLoading && (
            <div className="text-sm text-red-600">{error}</div>
          )}
          {!isLoading && !error && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Pincode</TableHead>
                <TableHead>Reported</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidents.map((inc) => (
                <TableRow key={inc.id}>
                  <TableCell className="font-medium">{inc.id}</TableCell>
                  <TableCell className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" /> {inc.type}
                  </TableCell>
                  <TableCell>
                    {inc.severity === "critical" && <Badge variant="destructive">Critical</Badge>}
                    {inc.severity === "warning" && <Badge variant="secondary">Warning</Badge>}
                    {inc.severity === "info" && <Badge>Info</Badge>}
                  </TableCell>
                  <TableCell>{inc.pincode}</TableCell>
                  <TableCell>{new Date(inc.reportedAt).toLocaleString()}</TableCell>
                  <TableCell>
                    {inc.status === "open" && <Badge variant="destructive">Open</Badge>}
                    {inc.status === "acknowledged" && <Badge variant="secondary">Acknowledged</Badge>}
                    {inc.status === "resolved" && <Badge>Resolved</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => openDetails(inc)}>View</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Map className="h-5 w-5" /> Incident Map</DialogTitle>
          </DialogHeader>
          <div>
            <OceanMap markers={markers} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Incident Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" /> Incident Details
            </DialogTitle>
          </DialogHeader>
          {selectedIncident && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">ID</span>
                <span className="col-span-2 font-medium">{selectedIncident.id}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">Type</span>
                <span className="col-span-2 font-medium">{selectedIncident.type}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">Severity</span>
                <span className="col-span-2">
                  {selectedIncident.severity === "critical" && <Badge variant="destructive">Critical</Badge>}
                  {selectedIncident.severity === "warning" && <Badge variant="secondary">Warning</Badge>}
                  {selectedIncident.severity === "info" && <Badge>Info</Badge>}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">Pincode</span>
                <span className="col-span-2 font-medium">{selectedIncident.pincode}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">Reported</span>
                <span className="col-span-2 font-medium">{new Date(selectedIncident.reportedAt).toLocaleString()}</span>
              </div>
            </div>
          )}
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={closeDetails}>Close</Button>
            <Button onClick={acknowledgeIncident} className="gap-2"><Users className="h-4 w-4" /> Acknowledge</Button>
            <Button variant="secondary" onClick={resolveIncident} className="gap-2"><CheckCircle2 className="h-4 w-4" /> Resolved</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}