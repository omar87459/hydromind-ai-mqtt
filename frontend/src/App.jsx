import { useState } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Sidebar from "./components/layout/Sidebar";
import TopBar from "./components/layout/TopBar";
import { AppProvider } from "./context/AppContext";

import OverviewPage from "./pages/OverviewPage";
import CropsPage from "./pages/CropsPage";
import MethodsPage from "./pages/MethodsPage";
import GrowthStagesPage from "./pages/GrowthStagesPage";
import MonitoringPage from "./pages/MonitoringPage";
import AssistantPage from "./pages/AssistantPage";
import ArchitecturePage from "./pages/ArchitecturePage";
import ModelLabPage from "./pages/ModelLabPage";

const PAGE_META = {
  "/": {
    title: "Farm Overview",
    subtitle: "A snapshot of your hydroponic operation, powered by HydroMind AI.",
  },
  "/crops": {
    title: "Crop Database",
    subtitle: "Ideal growing conditions for every crop in the HydroMind AI library.",
  },
  "/methods": {
    title: "Hydroponic Methods",
    subtitle: "Compare systems and find compatible crops for each method.",
  },
  "/growth": {
    title: "Interactive Growth Stages",
    subtitle: "See how targets shift across the crop lifecycle.",
  },
  "/monitoring": {
    title: "AI Monitoring & Automation",
    subtitle: "Live sensor readings, AI decision engine, and automation controls.",
  },
  "/assistant": {
    title: "AI Knowledge Assistant",
    subtitle: "Ask about hydroponics — answered from a local knowledge base.",
  },
  "/architecture": {
    title: "System Architecture",
    subtitle: "From farm sensors to the farmer's dashboard, including satellite backup.",
  },
  "/model-lab": {
    title: "AI Model Lab",
    subtitle: "Inspect and test the prototype machine learning models powering HydroMind AI.",
  },
};

function Shell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const meta = PAGE_META[location.pathname] || { title: "HydroMind AI" };

  return (
    <div className="app-shell">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="main-area">
        <TopBar title={meta.title} subtitle={meta.subtitle} onMenuClick={() => setMenuOpen(true)} />
        <div className="page-content">
          <Routes>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/crops" element={<CropsPage />} />
            <Route path="/methods" element={<MethodsPage />} />
            <Route path="/growth" element={<GrowthStagesPage />} />
            <Route path="/monitoring" element={<MonitoringPage />} />
            <Route path="/assistant" element={<AssistantPage />} />
            <Route path="/architecture" element={<ArchitecturePage />} />
            <Route path="/model-lab" element={<ModelLabPage />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Shell />
      </AppProvider>
    </BrowserRouter>
  );
}
