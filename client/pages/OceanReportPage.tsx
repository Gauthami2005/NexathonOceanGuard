import React, { FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react"; 

// --- PLACEHOLDER DATA & LOGIC ---
const OCEAN_REPORT_TYPES = ["Oil Spill", "Marine Life Distress", "Pollution/Debris", "Unusual Algae", "Flood","High Waves","Tsunami","Cyclone","Other"];
const filteredReports: any[] = []; 
const API_BASE = (import.meta as any).env?.VITE_API_BASE || "http://localhost:3001";

// --- UPDATED SUBMIT HANDLER ---
const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  const form = e.currentTarget as HTMLFormElement;
  
  // 1. Create FormData directly from the form.
  // This automatically picks up all fields with a 'name' attribute.
  const formData = new FormData(form);

  // 2. Manually append any data NOT in the form.
  // Your 'category' was hardcoded, so we add it to the FormData here.
  formData.append('category', 'ocean');

  try {
    const res = await fetch(`${API_BASE}/api/reports`, { 
      method: 'POST',
      
      // 3. REMOVED headers: { 'Content-Type': 'application/json' }
      // The browser MUST set the 'Content-Type' to 'multipart/form-data'
      // automatically so it can include the file boundary.
      
      // 4. Use formData as the body
      body: formData 
    });
    
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data?.error || `Failed (${res.status})`);
      return;
    }
    
    alert('✅ Ocean Report saved.');
    form.reset();

  } catch (error) {
    console.error("Failed to submit form:", error);
    alert("An error occurred while submitting the report.");
  }
};
// --------------------------------

export default function OceanReportPage() {
  
  return (
    // Uses the same 3:1 grid ratio (lg:col-span-3 and lg:col-span-1)
    <div className="container mx-auto py-10 grid gap-10 lg:grid-cols-4"> 
      
      {/* LEFT COLUMN: OCEAN REPORT FORM (Spans 3 of 4 columns) */}
      <section id="report" className="space-y-4 lg:col-span-3"> 
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ocean Reporting</h1>
          <p className="text-muted-foreground">Submit reports on marine pollution, environmental hazards, or distressed wildlife.</p>
        </div>

        <form onSubmit={handleFormSubmit} className="rounded-xl border bg-card p-4 md:p-6 shadow-sm space-y-4">
          
          {/* Title and Type Row */}
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

          {/* Description Textarea */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" placeholder="Provide details, size, and approximate location/coordinates." required />
          </div>

          {/* Location and Pincode Row */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="location">Area Location</Label>
              <Input id="location" name="location" placeholder="Beach/Coast or Coordinates (e.g., 12.9716, 77.5946)" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pincode">Nearest Pincode</Label>
              <Input id="pincode" name="pincode" placeholder="e.g., 575003" required type="number" pattern="\d{6}" maxLength={6} />
            </div>
          </div>
          
          {/* --- UPDATED PHOTO FIELD --- */}
          {/* The 'name' attribute MUST match the server's multer field name */}
          <div className="space-y-2">
            <Label htmlFor="image">Photo (Optional)</Label>
            <Input id="image" name="image" type="file" accept="image/*" />
          </div>
          {/* --------------------------- */}

          <div className="flex justify-end pt-2">
            <Button type="submit" className="px-6">Submit Ocean Report</Button>
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