import { Link } from "react-router-dom";
import { Waves } from "lucide-react";

export default function Header() {
  return (
    <header className="h-[var(--header-height)] border-b border-[#1a2332] bg-[#0f1625] backdrop-blur supports-[backdrop-filter]:bg-[#0f1625]/80">
      <div className="flex h-[var(--header-height)] items-center justify-between px-6">
        {/* Logo on the left - minimal */}
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-cyan-500 to-purple-600">
            <Waves className="h-4 w-4 text-white" />
          </span>
          <Link to="/" className="font-bold text-white hover:text-cyan-400 transition-colors">
            Ocean Guard
          </Link>
        </div>

        {/* User indicator on the right */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
            <span className="text-xs font-bold text-white">U</span>
          </div>
        </div>
      </div>
    </header>
  );
}