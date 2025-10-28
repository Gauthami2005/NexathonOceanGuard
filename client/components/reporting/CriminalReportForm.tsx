import { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export const CriminalReportForm = () => {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    console.log("Criminal report submitted", Object.fromEntries(data.entries()));
    alert("Criminal report submitted (demo)");
    e.currentTarget.reset();
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border bg-card p-4 md:p-6 shadow-sm space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Criminal Report</h1>
        <p className="text-muted-foreground">Provide details to report a criminal incident.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" placeholder="e.g., Theft near market" required />
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
        <Textarea id="description" name="description" placeholder="Describe what happened" required />
      </div>

      <div className="flex justify-end">
        <Button type="submit" className="px-6">Submit Criminal Report</Button>
      </div>
    </form>
  );
};

export default CriminalReportForm;


