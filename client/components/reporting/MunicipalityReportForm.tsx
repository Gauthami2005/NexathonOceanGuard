import { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export const MunicipalityReportForm = () => {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    console.log("Municipality report submitted", Object.fromEntries(data.entries()));
    alert("Municipality report submitted (demo)");
    e.currentTarget.reset();
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border bg-card p-4 md:p-6 shadow-sm space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Municipality Report</h1>
        <p className="text-muted-foreground">Report civic issues for municipal attention.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="issue">Issue</Label>
          <Input id="issue" name="issue" placeholder="e.g., Pothole, Streetlight out" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input id="location" name="location" placeholder="Area or landmark" required />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="pincode">Pincode</Label>
          <Input id="pincode" name="pincode" placeholder="e.g., 575003" required type="number" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact">Contact (optional)</Label>
          <Input id="contact" name="contact" placeholder="Your phone or email" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" placeholder="Describe the issue and location details" required />
      </div>

      <div className="flex justify-end">
        <Button type="submit" className="px-6">Submit Municipality Report</Button>
      </div>
    </form>
  );
};

export default MunicipalityReportForm;


