import Header from "./Header";
import Sidebar from "./Sidebar";
import { PropsWithChildren } from "react";

type LayoutProps = PropsWithChildren<{
  isSidebarOpen?: boolean;
  toggleSidebar?: () => void;
}>;

export default function Layout({ children, isSidebarOpen = true, toggleSidebar }: LayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0e1a]">
      {/* Fixed Sidebar */}
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main Content Area */}
      <div className={`flex flex-1 flex-col overflow-hidden transition-all duration-300 ${isSidebarOpen ? "ml-64" : "ml-20"}`}>
        {/* Minimal Header Bar */}
        <Header />
        
        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto bg-background min-h-screen">
          <div className="container mx-auto px-6 py-8">
            {children}
          </div>
        </main>
        
      </div>
    </div>
  );
}
