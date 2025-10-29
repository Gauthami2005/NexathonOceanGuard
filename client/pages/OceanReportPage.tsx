import React, { FormEvent, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";

const OCEAN_REPORT_TYPES = [
  "Oil Spill", "Marine Life Distress", "Pollution/Debris", "Unusual Algae", 
  "Flood", "High Waves", "Tsunami", "Cyclone", "Other"
];

const filteredReports: any[] = [];

// Change this to FastAPI backend
const ML_API_BASE = "http://127.0.0.1:8001";

export default function OceanReportPage() {
  const [loading, setLoading] = useState(false);

  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    setLoading(true);

    try {
      // 1️⃣ Send form to FastAPI for ML verification
      const mlRes = await fetch(`${ML_API_BASE}/verify-hazard`, {
        method: "POST",
        body: formData,
      });

      if (!mlRes.ok) {
        const err = await mlRes.json().catch(() => ({}));
        alert(`ML Server Error (${mlRes.status}): ${err?.detail || "Something went wrong"}`);
        setLoading(false);
        return;
      }

      const mlData = await mlRes.json();
      console.log("ML Response:", mlData);

      // 2️⃣ Show results to the user
      alert(
        `✅ Model Prediction:
Hazard: ${mlData.predictedLabel}
Confidence: ${(mlData.confidence * 100).toFixed(2)}%
Authentic: ${mlData.authenticity ? "Yes" : "No"}`
      );

      // 3️⃣ Optionally send to your Node backend (for DB saving)
      // Change this to your Node API if you want to store the report
      const NODE_API_BASE = "http://localhost:3001";
      await fetch(`${NODE_API_BASE}/api/reports`, {
        method: "POST",
        body: formData,
      });

      form.reset();
    } catch (error) {
      console.error("❌ Submit failed:", error);
      alert("Error connecting to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 grid gap-10 lg:grid-cols-4">
      {/* LEFT COLUMN: OCEAN REPORT FORM */}
      <section id="report" className="space-y-4 lg:col-span-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ocean Reporting</h1>
          <p className="text-muted-foreground">
            Submit reports on marine pollution, environmental hazards, or distressed wildlife.
          </p>
        </div>

        <form onSubmit={handleFormSubmit} className="rounded-xl border bg-card p-4 md:p-6 shadow-sm space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" placeholder="e.g., Oil slick sighting" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select name="type" defaultValue="Oil Spill">
                <SelectTrigger id="type"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {OCEAN_REPORT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Provide details, size, and approximate location/coordinates."
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="location">Area Location</Label>
              <Input id="location" name="location" placeholder="Beach/Coast or Coordinates" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pincode">Nearest Pincode</Label>
              <Input id="pincode" name="pincode" placeholder="e.g., 575003" required type="number" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Photo (Optional)</Label>
            <Input id="image" name="image" type="file" accept="image/*" />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={loading} className="px-6">
              {loading ? "Processing..." : "Submit Ocean Report"}
            </Button>
          </div>
        </form>
      </section>

      {/* RIGHT COLUMN: COMMUNITY REPORTS */}
      <section className="space-y-4 lg:col-span-1">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Community Reports</h2>
            <p className="text-muted-foreground">Filter by type or date.</p>
          </div>
        </div>

        <div className="grid gap-4">
          {filteredReports.length === 0 ? (
            <div className="rounded-lg border bg-secondary/40 p-6 text-center text-sm text-muted-foreground">
              <AlertTriangle className="h-10 w-10 mx-auto mb-2 text-primary" />
              No reports submitted yet. Be the first to report an incident.
            </div>
          ) : (
            filteredReports.map((r) => <div key={r.id}>Report Card for {r.title}</div>)
          )}
        </div>
      </section>
    </div>
  );
}