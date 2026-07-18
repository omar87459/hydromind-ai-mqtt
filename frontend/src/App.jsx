import { useState } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
import SensorConnectivityPage from "./pages/SensorConnectivityPage";
import FarmConnectivityPage from "./pages/FarmConnectivityPage";
import EnergyDashboardPage from "./pages/EnergyDashboardPage";

const PAGE_META = {
  "/": { titleKey: "overviewTitle", subtitleKey: "overviewSubtitle" },
  "/crops": { titleKey: "cropsTitle", subtitleKey: "cropsSubtitle" },
  "/methods": { titleKey: "methodsTitle", subtitleKey: "methodsSubtitle" },
  "/growth": { titleKey: "growthTitle", subtitleKey: "growthSubtitle" },
  "/monitoring": { titleKey: "monitoringTitle", subtitleKey: "monitoringSubtitle" },
  "/assistant": { titleKey: "assistantTitle", subtitleKey: "assistantSubtitle" },
  "/architecture": { titleKey: "architectureTitle", subtitleKey: "architectureSubtitle" },
  "/model-lab": { titleKey: "modelLabTitle", subtitleKey: "modelLabSubtitle" },
  "/sensors": { titleKey: "sensorsTitle", subtitleKey: "sensorsSubtitle" },
  "/farm-network": { titleKey: "farmNetworkTitle", subtitleKey: "farmNetworkSubtitle" },
  "/energy": { titleKey: "energyTitle", subtitleKey: "energySubtitle" },
};

function Shell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { t } = useTranslation();
  const meta = PAGE_META[location.pathname];

  return (
    <div className="app-shell">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="main-area">
        <TopBar
          title={meta ? t(`pageMeta.${meta.titleKey}`) : t("nav.brandName")}
          subtitle={meta ? t(`pageMeta.${meta.subtitleKey}`) : undefined}
          onMenuClick={() => setMenuOpen(true)}
        />
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
            <Route path="/sensors" element={<SensorConnectivityPage />} />
            <Route path="/farm-network" element={<FarmConnectivityPage />} />
            <Route path="/energy" element={<EnergyDashboardPage />} />
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
