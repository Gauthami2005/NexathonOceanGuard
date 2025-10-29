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
  const [isAcknowledging, setIsAcknowledging] = useState<boolean>(false);
  const [isResolving, setIsResolving] = useState<boolean>(false);
  const [isAcknowledgingAll, setIsAcknowledgingAll] = useState<boolean>(false);
  const [isResolvingAll, setIsResolvingAll] = useState<boolean>(false);

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

  const acknowledgeIncident = async () => {
    if (!selectedIncident || isAcknowledging) return;
    
    setIsAcknowledging(true);
    console.log('Acknowledge button clicked for incident:', selectedIncident.id);
    
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      console.log('Token available:', !!token);
      
      const response = await fetch(`http://localhost:3001/api/reports/${selectedIncident.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newStatus: 'Acknowledged',
          authorityNotes: 'Incident acknowledged by authorities'
        })
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        console.log('Successfully acknowledged incident');
        setIncidents((prev) =>
          prev.map((i) => (i.id === selectedIncident.id ? { ...i, status: "acknowledged" } : i))
        );
        closeDetails();
      } else {
        const errorText = await response.text();
        console.error('Failed to acknowledge incident:', response.status, errorText);
        alert('Failed to acknowledge incident. Please try again.');
      }
    } catch (error) {
      console.error('Error acknowledging incident:', error);
      alert('Error acknowledging incident. Please try again.');
    } finally {
      setIsAcknowledging(false);
    }
  };

  const resolveIncident = async () => {
    if (!selectedIncident) return;
    
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const response = await fetch(`http://localhost:3001/api/reports/${selectedIncident.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newStatus: 'Resolved',
          authorityNotes: 'Incident resolved by authorities'
        })
      });

      if (response.ok) {
        setIncidents((prev) => prev.map((i) => (i.id === selectedIncident.id ? { ...i, status: "resolved" } : i)));
        closeDetails();
      } else {
        console.error('Failed to resolve incident');
      }
    } catch (error) {
      console.error('Error resolving incident:', error);
    }
  };

  const acknowledgeAllIncidents = async () => {
    const openIncidents = incidents.filter(inc => inc.status === "open");
    if (openIncidents.length === 0) {
      alert('No open incidents to acknowledge');
      return;
    }

    setIsAcknowledgingAll(true);
    console.log(`Acknowledging ${openIncidents.length} incidents`);

    try {
      const promises = openIncidents.map(async (incident) => {
        const response = await fetch(`http://localhost:3001/api/reports/${incident.id}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            newStatus: 'Acknowledged',
            authorityNotes: 'Bulk acknowledged by authorities'
          })
        });
        return { incident, success: response.ok };
      });

      const results = await Promise.all(promises);
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      if (successful.length > 0) {
        setIncidents((prev) =>
          prev.map((i) => 
            successful.some(s => s.incident.id === i.id) 
              ? { ...i, status: "acknowledged" as const }
              : i
          )
        );
      }

      if (failed.length > 0) {
        console.error(`Failed to acknowledge ${failed.length} incidents`);
        alert(`Successfully acknowledged ${successful.length} incidents. ${failed.length} failed.`);
      } else {
        console.log(`Successfully acknowledged all ${successful.length} incidents`);
      }
    } catch (error) {
      console.error('Error acknowledging all incidents:', error);
      alert('Error acknowledging incidents. Please try again.');
    } finally {
      setIsAcknowledgingAll(false);
    }
  };

  const resolveAllIncidents = async () => {
    const acknowledgedIncidents = incidents.filter(inc => inc.status === "acknowledged");
    if (acknowledgedIncidents.length === 0) {
      alert('No acknowledged incidents to resolve');
      return;
    }

    setIsResolvingAll(true);
    console.log(`Resolving ${acknowledgedIncidents.length} incidents`);

    try {
      const promises = acknowledgedIncidents.map(async (incident) => {
        const response = await fetch(`http://localhost:3001/api/reports/${incident.id}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            newStatus: 'Resolved',
            authorityNotes: 'Bulk resolved by authorities'
          })
        });
        return { incident, success: response.ok };
      });

      const results = await Promise.all(promises);
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      if (successful.length > 0) {
        setIncidents((prev) =>
          prev.map((i) => 
            successful.some(s => s.incident.id === i.id) 
              ? { ...i, status: "resolved" as const }
              : i
          )
        );
      }

      if (failed.length > 0) {
        console.error(`Failed to resolve ${failed.length} incidents`);
        alert(`Successfully resolved ${successful.length} incidents. ${failed.length} failed.`);
      } else {
        console.log(`Successfully resolved all ${successful.length} incidents`);
      }
    } catch (error) {
      console.error('Error resolving all incidents:', error);
      alert('Error resolving incidents. Please try again.');
    } finally {
      setIsResolvingAll(false);
    }
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
              {incidents.filter(inc => inc.status === "open").length > 0 && (
                <Button 
                  size="sm" 
                  className="gap-2"
                  onClick={acknowledgeAllIncidents}
                  disabled={isAcknowledgingAll}
                >
                  <CheckCircle2 className="h-4 w-4" /> 
                  {isAcknowledgingAll 
                    ? 'Acknowledging All...' 
                    : `Acknowledge All (${incidents.filter(inc => inc.status === "open").length})`
                  }
                </Button>
              )}
              {incidents.filter(inc => inc.status === "acknowledged").length > 0 && (
                <Button 
                  size="sm" 
                  variant="secondary"
                  className="gap-2"
                  onClick={resolveAllIncidents}
                  disabled={isResolvingAll}
                >
                  <CheckCircle2 className="h-4 w-4" /> 
                  {isResolvingAll 
                    ? 'Resolving All...' 
                    : `Resolve All (${incidents.filter(inc => inc.status === "acknowledged").length})`
                  }
                </Button>
              )}
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
                    {inc.status === "resolved" && <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Resolved</Badge>}
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
                <span className="text-muted-foreground">Status</span>
                <span className="col-span-2">
                  {selectedIncident.status === "open" && <Badge variant="destructive">Open</Badge>}
                  {selectedIncident.status === "acknowledged" && <Badge variant="secondary">Acknowledged</Badge>}
                  {selectedIncident.status === "resolved" && <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Resolved</Badge>}
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
            {selectedIncident?.status === "open" && (
              <Button 
                onClick={acknowledgeIncident}
                disabled={isAcknowledging}
                className="gap-2"
              >
                <Users className="h-4 w-4" /> 
                {isAcknowledging ? 'Acknowledging...' : 'Acknowledge'}
              </Button>
            )}
            {selectedIncident?.status === "acknowledged" && (
              <Button variant="secondary" onClick={resolveIncident} className="gap-2">
                <CheckCircle2 className="h-4 w-4" /> Resolve
              </Button>
            )}
            {selectedIncident?.status === "resolved" && (
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Incident Resolved
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}