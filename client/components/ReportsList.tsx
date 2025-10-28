import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Report = {
  id: string;
  category: string;
  title: string;
  type: string;
  description: string;
  location?: string;
  pincode?: string;
  createdAt: string;
  status: string;
  ai?: { isHazard: boolean | null; confidence: number | null; components?: any } | null;
};

export default function ReportsList() {
  const API_BASE = (import.meta as any).env?.VITE_API_BASE || "http://localhost:3001";
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/reports`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Failed (${res.status})`);
      setReports(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <div className="text-sm text-muted-foreground">Loading reports…</div>;
  if (error) return <div className="text-sm text-destructive">{error}</div>;
  if (!reports.length) return (
    <div className="rounded-lg border bg-secondary/40 p-6 text-center text-sm text-muted-foreground">
      No reports yet. Be the first to report an incident.
    </div>
  );

  return (
    <div className="grid gap-3">
      {reports.map((r) => (
        <Card key={r.id}>
          <CardContent className="p-4 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{r.title}</span>
                <Badge variant="secondary">{r.category}</Badge>
                {r.type && <Badge>{r.type}</Badge>}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{r.description}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {r.location || ""} {r.pincode ? `• ${r.pincode}` : ""}
              </p>
              {r.ai && r.ai.confidence !== null && (
                <p className="text-xs mt-2">
                  AI confidence: <span className="font-medium">{(r.ai.confidence as number).toFixed(2)}</span>
                  {typeof r.ai.isHazard === 'boolean' && (
                    <> • {r.ai.isHazard ? 'hazard' : 'not hazard'}</>
                  )}
                </p>
              )}
            </div>
            <div className="text-right">
              <Badge variant="outline">{new Date(r.createdAt).toLocaleString()}</Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}


