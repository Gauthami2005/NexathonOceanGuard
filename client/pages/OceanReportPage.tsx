import React, { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";

const OCEAN_REPORT_TYPES = [
  "Oil Spill", "Marine Life Distress", "Pollution/Debris",
  "Unusual Algae", "Flood", "High Waves", "Tsunami",
  "Cyclone", "Other"
];

const filteredReports: any[] = [];
const API_BASE = (import.meta as any).env?.VITE_API_BASE || "http://localhost:3001";

export default function OceanReportPage() {
  const navigate = useNavigate();

  // --- FORM SUBMISSION HANDLER ---
  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;

    try {
      // ✅ Retrieve and parse token correctly
      let token: string | null = localStorage.getItem('token');
      if (token) {
        try {
          token = JSON.parse(token); // handle stringified token
        } catch {
          console.log('error parsing token, using raw value');
          // if it's already a string, skip parsing
        }
      }

      // ✅ Check for missing token
      if (!token) {
        alert('⚠️ You need to log in before submitting a report.');
        navigate('/login');
        return;
      }

      // ✅ Create FormData
      const formData = new FormData(form);
      formData.append('category', 'ocean');

      console.log("🔑 Sending Token:", token); // Debugging log (safe to remove later)

      // ✅ Submit to backend with Authorization header
      const res = await fetch(`${API_BASE}/api/reports`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error('API Error:', data);
        alert(data?.error || data?.message || `Request failed (${res.status})`);
        return;
      }

      alert('✅ Ocean Report submitted successfully!');
      form.reset();

    } catch (error) {
      console.error("❌ Failed to submit report:", error);
      alert("An unexpected error occurred while submitting the report.");
    }
  };

  // --- RENDER UI ---
  return (
    <div className="container mx-auto py-10 grid gap-10 lg:grid-cols-4">
      
      {/* LEFT COLUMN — Report Form */}
      <section id="report" className="space-y-4 lg:col-span-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ocean Reporting</h1>
          <p className="text-muted-foreground">
            Submit reports on marine pollution, environmental hazards, or distressed wildlife.
          </p>
        </div>

        <form onSubmit={handleFormSubmit} className="rounded-xl border bg-card p-4 md:p-6 shadow-sm space-y-4">

          {/* Title and Type */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" placeholder="e.g., Oil slick sighting" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select name="type" defaultValue="Oil Spill">
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {OCEAN_REPORT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Provide details, size, and approximate location/coordinates."
              required
            />
          </div>

          {/* Location and Pincode */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="location">Area Location</Label>
              <Input
                id="location"
                name="location"
                placeholder="Beach/Coast or Coordinates (e.g., 12.9716, 77.5946)"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pincode">Nearest Pincode</Label>
              <Input
                id="pincode"
                name="pincode"
                placeholder="e.g., 575003"
                required
                type="number"
                inputMode="numeric"
              />
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label htmlFor="image">Photo (Optional)</Label>
            <Input id="image" name="image" type="file" accept="image/*" />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" className="px-6">
              Submit Ocean Report
            </Button>
          </div>
        </form>
      </section>

      {/* RIGHT COLUMN — Community Reports */}
      <section className="space-y-4 lg:col-span-1">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Community Reports</h2>
            <p className="text-muted-foreground">Filter by type or date.</p>
          </div>
          <div className="flex gap-3">
            {/* Type Filter Placeholder */}
            <Select>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Types</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Filter Placeholder */}
            <Select>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Dates</SelectItem>
                <SelectItem value="Today">Today</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Placeholder for Reports */}
        <div className="grid gap-4">
          {filteredReports.length === 0 ? (
            <div className="rounded-lg border bg-secondary/40 p-6 text-center text-sm text-muted-foreground">
              <AlertTriangle className="h-10 w-10 mx-auto mb-2 text-primary" />
              No reports submitted yet. Be the first to report a marine incident.
            </div>
          ) : (
            filteredReports.map((r) => (
              <div key={r.id}>Report Card for {r.title}</div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
