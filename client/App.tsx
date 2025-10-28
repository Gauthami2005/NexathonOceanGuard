import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Layout from "@/components/layout/Layout";
import Community from "@/pages/Community";
import PlaceholderPage from "@/pages/PlaceholderPage";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Authorities from "@/pages/Authorities";
import Profile from "@/pages/Profile";
// --- REQUIRED NEW IMPORT ---
import AssignTeamsPage from "./pages/AssignTeamsPage"; // Import your new component
// -------------------------
import CriminalReportPage from "./pages/CriminalReportPage";
import MunicipalityReportPage from "./pages/MunicipalityReportPage";
import OceanReportPage from "./pages/OceanReportPage";

const queryClient = new QueryClient();

const App = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Layout isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar}>
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/community" element={<Community />} />
            <Route
              path="/alerts"
              element={
                <PlaceholderPage
                  title="Live Alerts"
                  description="A dedicated alerts dashboard can be added here. For now, view alerts on the homepage."
                />
              }
            />
            <Route
              path="/report"
              element={
                <PlaceholderPage
                  title="Report Incident"
                  description="Use the Community page to submit a report. We can add a standalone report flow here if you prefer."
                />
              }
            />
            
            <Route path="/authorities" element={<Authorities />} />

            {/* --- UPDATED ROUTE: Use the actual AssignTeamsPage component --- */}
            <Route 
              path="/assign-teams" 
              element={<AssignTeamsPage />} // Now uses the actual component
            />
            {/* ------------------------------------------------------------- */}
            <Route path="/criminalreport" element={<CriminalReportPage />} />
            <Route path="/municipalityreport" element={<MunicipalityReportPage />} />
            <Route path="/oceanreport" element={<OceanReportPage />} />
            
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/profile" element={<Profile />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;