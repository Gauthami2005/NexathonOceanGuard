import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-border/50 bg-sidebar-background">
      <div className="container grid gap-10 py-12 md:grid-cols-3 lg:grid-cols-3">
        <div>
          <h2 className="text-base font-semibold tracking-wide text-foreground">Ocean Guard</h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground/80 max-w-prose">
            A modern disaster alert & reporting platform. Minimal, trustworthy, and user-friendly.
          </p>
        </div>
        <div>
          <h2 className="text-base font-semibold tracking-wide text-cyan-400">Helplines</h2>
          <ul className="mt-4 space-y-2 text-sm text-foreground/80">
            <li><span className="font-medium text-foreground">Emergency</span> — 112</li>
            <li><span className="font-medium text-foreground">Disaster Mgmt</span> — 108</li>
            <li><span className="font-medium text-foreground">Coast Guard</span> — +91 1554</li>
          </ul>
        </div>
        <div>
          <h2 className="text-base font-semibold tracking-wide text-cyan-400">Quick Links</h2>
          <ul className="mt-4 space-y-2 text-sm text-foreground/80">
            <li><Link to="/alerts" className="hover:text-cyan-400 transition-colors">Live Alerts</Link></li>
            <li><Link to="/community" className="hover:text-cyan-400 transition-colors">Community</Link></li>
            <li><Link to="/community" className="hover:text-cyan-400 transition-colors">Report Incident</Link></li>
            <li><Link to="/login" className="hover:text-cyan-400 transition-colors">Login</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/50 py-4 text-center text-xs text-foreground/50">
        © {new Date().getFullYear()} Ocean Guard. All rights reserved.
      </div>
    </footer>
  );
}
