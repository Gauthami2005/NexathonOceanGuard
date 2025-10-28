import React, { FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react"; 

// --- PLACEHOLDER DATA & LOGIC ---
const MUNICIPAL_REPORT_TYPES = ["Street Debris", "Public Pollution", "Drain Blockage", "Infrastructure Damage", "Other"];
const filteredReports: any[] = []; 
const API_BASE = (import.meta as any).env?.VITE_API_BASE || "http://localhost:3001";

// --- START: UPDATED SUBMIT HANDLER ---
const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  const form = e.currentTarget as HTMLFormElement;
  
  // 1. Create FormData directly from the form.
  const formData = new FormData(form);

  // 2. Manually append the 'municipality' category
  formData.append('category', 'municipality');

  try {
    const res = await fetch(`${API_BASE}/api/reports`, { 
      method: 'POST',
      
      // 3. REMOVED headers: { 'Content-Type': 'application/json' }
      // 4. Use formData as the body
      body: formData 
    });
    
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data?.error || `Failed (${res.status})`);
      return;
    }
    
    alert('✅ Municipality Report saved.');
    form.reset();

  } catch (error) {
    console.error("Failed to submit form:", error);
    alert("An error occurred while submitting the report.");
  }
};
// --- END: UPDATED SUBMIT HANDLER ---

export default function MunicipalityReportPage() {
  
  return (
    // Uses the 3:1 grid ratio (lg:col-span-3 for form, lg:col-span-1 for reports)
    <div className="container mx-auto py-10 grid gap-10 lg:grid-cols-4"> 
      
      {/* LEFT COLUMN: MUNICIPALITY REPORT FORM (Spans 3 of 4 columns) */}
      <section id="report" className="space-y-4 lg:col-span-3"> 
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Municipal Reporting</h1>
          <p className="text-muted-foreground">Report issues related to public infrastructure, sanitation, and urban pollution.</p>
        </div>

        {/* START: INLINE MUNICIPALITY REPORT FORM JSX */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Submit Municipality Incident</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFormSubmit} className="space-y-6">
              
              {/* Title and Type Row */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" name="title" placeholder="e.g., Debris blocking drain" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select name="type" defaultValue="Street Debris">
                    <SelectTrigger id="type"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {MUNICIPAL_REPORT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Description Textarea */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  placeholder="Provide detailed description of the municipal issue and its impact." 
                  rows={4}
                  required 
                />
              </div>

              {/* Location and Pincode Row */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="location">Street Address/Area Location</Label>
                  <Input id="location" name="location" placeholder="Exact street address or nearby landmark" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input id="pincode" name="pincode" placeholder="e.g., 575003" required type="number" pattern="\d{6}" maxLength={6} />
                </div>
              </div>

              {/* --- START: UPDATED PHOTO FIELD --- */}
              <div className="space-y-2">
                <Label htmlFor="image" className="block">
                  Photo (Optional)
                </Label>
                <Input 
                  id="image" 
                  name="image" // Changed from 'photo' to 'image'
                  type="file" 
                  accept="image/*" 
                  className="file:text-primary file:font-semibold file:bg-primary/10 hover:file:bg-primary/20 cursor-pointer"
                />
              </div>
              {/* --- END: UPDATED PHOTO FIELD --- */}

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <Button type="submit" className="px-8">
                  Submit Municipality Report
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        {/* END: INLINE MUNICIPALITY REPORT FORM JSX */}
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

      