import { NavLink } from "react-router-dom";
import { Waves, AlertTriangle, Users, FileText, LogIn, UserPlus, User } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Sidebar({ isOpen = true, toggleSidebar }: { isOpen?: boolean; toggleSidebar?: () => void; }) {
  const isLoggedIn = typeof window !== "undefined" && !!localStorage.getItem("token");

  const navigationItems = [
    { path: "/", label: "Home", icon: Waves },
    { path: "/alerts", label: "Alerts", icon: AlertTriangle },
    { path: "/community", label: "Community", icon: Users },
    { path: "/report", label: "Report", icon: FileText },
  ];

  const authItems = isLoggedIn 
    ? [{ path: "/profile", label: "Profile", icon: User }]
    : [
        { path: "/login", label: "Login", icon: LogIn },
        { path: "/signup", label: "Signup", icon: UserPlus },
      ];

  return (
    <aside className={cn(
      "fixed left-0 top-0 z-40 h-screen border-r border-[#1a2332] flex flex-col bg-[#0a0e1a] transition-[width] duration-300",
      isOpen ? "w-64" : "w-20"
    )}>
      {/* Logo/Brand clickable */}
      <button
        type="button"
        onClick={toggleSidebar}
        className="flex h-[var(--header-height)] items-center gap-3 border-b border-[#1a2332] px-6 w-full text-left hover:bg-[#0f1625] transition-colors"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600">
          <Waves className="h-5 w-5 text-white" />
        </div>
        <div className={cn("transition-opacity duration-200", isOpen ? "opacity-100" : "opacity-0 pointer-events-none") }>
          <p className="font-extrabold text-white text-sm">Ocean Guard</p>
          <p className="text-xs text-cyan-400">Stay Alert. Stay Safe.</p>
        </div>
      </button>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-1">
        {navigationItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            aria-label={item.label}
            title={item.label}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-gradient-to-r from-cyan-600 to-purple-600 text-white shadow-lg shadow-cyan-500/20"
                  : "text-gray-400 hover:bg-[#1a2332] hover:text-cyan-400"
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span className={cn("transition-opacity duration-200", isOpen ? "opacity-100" : "opacity-0 hidden")}>{item.label}</span>
          </NavLink>
        ))}

        <div className="my-4 h-px bg-[#1a2332]" />

        {authItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            aria-label={item.label}
            title={item.label}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-gradient-to-r from-cyan-600 to-purple-600 text-white shadow-lg shadow-cyan-500/20"
                  : "text-gray-400 hover:bg-[#1a2332] hover:text-cyan-400"
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span className={cn("transition-opacity duration-200", isOpen ? "opacity-100" : "opacity-0 hidden")}>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Quick Report Button */}
      <div className="p-3 border-t border-[#1a2332]">
        <NavLink
          to="/community"
          className="flex w-full items-center gap-2 rounded-lg bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/30 transition-all hover:shadow-fuchsia-500/50"
        >
          <AlertTriangle className="h-4 w-4" />
          <span className={cn("transition-opacity duration-200", isOpen ? "opacity-100" : "opacity-0 hidden")}>Report Incident</span>
        </NavLink>
      </div>
    </aside>
  );
}

