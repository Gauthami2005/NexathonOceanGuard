import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ReportsList from "@/components/ReportsList";

export default function PlaceholderPage({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-xl border bg-card p-10 text-center shadow-sm">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-2 text-muted-foreground">
          {description || "This page is a placeholder. Continue prompting to fill in this page contents if you want it."}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild variant="outline"><Link to="/">Go Home</Link></Button>
          <Button asChild><Link to="/community#report">Report Incident</Link></Button>
        </div>
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-3">Latest Alerts</h2>
        <ReportsList />
      </div>
    </div>
  );
}
