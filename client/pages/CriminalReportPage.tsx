// client/src/pages/CriminalReportPage.tsx

import React, { FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react"; 

// --- PLACEHOLDER DATA & LOGIC ---
const CRIMINAL_REPORT_TYPES = ["Poaching", "Illegal Dumping", "Unauthorized Vessel", "Other"];
const filteredReports: any[] = []; 
const API_BASE = (import.meta as any).env?.VITE_API_BASE || "http://localhost:3001";

const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  const form = e.currentTarget as HTMLFormElement;
  const formData = new FormData(form);
  const payload = {
    category: 'criminal',
    title: String(formData.get('title') || ''),
    type: String(formData.get('type') || 'Other'),
    description: String(formData.get('description') || ''),
    location: String(formData.get('location') || ''),
    pincode: String(formData.get('pincode') || ''),
  };
  const res = await fetch(`${API_BASE}/api/reports`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    alert(data?.error || `Failed (${res.status})`);
    return;
  }
  alert('✅ Criminal Report saved.');
  form.reset();
};
// --------------------------------

export default function CriminalReportPage() {
  
  return (
    // 💥 MODIFIED: Changed grid to 4 columns on large screens to make the form wider (3/4 width)
    <div className="container mx-auto py-10 grid gap-10 lg:grid-cols-4"> 
      
      {/* LEFT COLUMN: CRIMINAL REPORT FORM (Spans 3 of 4 columns) */}
      <section id="report" className="space-y-4 lg:col-span-3"> 
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Criminal Reporting</h1>
          <p className="text-muted-foreground">Submit detailed reports on illegal activities to alert authorities.</p>
        </div>

        <form onSubmit={handleFormSubmit} className="rounded-xl border bg-card p-4 md:p-6 shadow-sm space-y-4">
          
          {/* Title and Type Row */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" placeholder="e.g., Illegal fishing activity" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select name="type" defaultValue="Poaching">
                <SelectTrigger id="type"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {CRIMINAL_REPORT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description Textarea */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" placeholder="Provide details, timing, and specific location information." required />
          </div>

          {/* Location and Pincode Row */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="location">City/Area Location</Label>
              <Input id="location" name="location" placeholder="City or nearby landmark" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pincode">Pincode</Label>
              <Input id="pincode" name="pincode" placeholder="e.g., 575003" required type="number" pattern="\d{6}" maxLength={6} />
            </div>
          </div>
          
          {/* Photo Field */}
          <div className="space-y-2">
            <Label htmlFor="photo">Photo (Optional)</Label>
            <Input id="photo" name="photo" type="file" accept="image/*" />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" className="px-6">Submit Criminal Report</Button>
          </div>
        </form>
      </section>

      {/* RIGHT COLUMN: COMMUNITY REPORTS SECTION (Spans 1 of 4 columns) */}
      <section className="space-y-4 lg:col-span-1">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Community Reports</h2>
            <p className="text-muted-foreground">Filter by type or date.</p>
          </div>
          <div className="flex gap-3">
            {/* Type Filter Placeholder */}
            <Select>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Types</SelectItem>
              </SelectContent>
            </Select>
            {/* Date Filter Placeholder */}
            <Select>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Date" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Dates</SelectItem>
                <SelectItem value="Today">Today</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4">
          {filteredReports.length === 0 ? (
            <div className="rounded-lg border bg-secondary/40 p-6 text-center text-sm text-muted-foreground">
              <AlertTriangle className="h-10 w-100 mx-auto mb-2 text-primary" />
              No criminal reports submitted yet. Be the first to report an incident.
            </div>
          ) : (
            filteredReports.map((r) => <div key={r.id}>Report Card for {r.title}</div>) 
          )}
        </div>
      </section>
    </div>
  );
}