import { useState } from "react";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Sidebar from "./components/layout/Sidebar";
import TopBar from "./components/layout/TopBar";
import { ConnectingBlock } from "./components/common/AsyncState";
import { AppProvider, useApp } from "./context/AppContext";
import { AuthProvider, useAuth } from "./context/AuthContext";

import LoginPage from "./pages/LoginPage";
import OverviewPage from "./pages/OverviewPage";
import CropsPage from "./pages/CropsPage";
import MethodsPage from "./pages/MethodsPage";
import GrowthStagesPage from "./pages/GrowthStagesPage";
import MonitoringPage from "./pages/MonitoringPage";
import AutomationControlPage from "./pages/AutomationControlPage";
import AssistantPage from "./pages/AssistantPage";
import ArchitecturePage from "./pages/ArchitecturePage";
import ModelLabPage from "./pages/ModelLabPage";
import FarmConnectivityPage from "./pages/FarmConnectivityPage";
import EnergyDashboardPage from "./pages/EnergyDashboardPage";

const PAGE_META = {
  "/": { titleKey: "overviewTitle", subtitleKey: "overviewSubtitle" },
  "/crops": { titleKey: "cropsTitle", subtitleKey: "cropsSubtitle" },
  "/methods": { titleKey: "methodsTitle", subtitleKey: "methodsSubtitle" },
  "/growth": { titleKey: "growthTitle", subtitleKey: "growthSubtitle" },
  "/monitoring": { titleKey: "monitoringTitle", subtitleKey: "monitoringSubtitle" },
  "/automation": { titleKey: "automationTitle", subtitleKey: "automationSubtitle" },
  "/assistant": { titleKey: "assistantTitle", subtitleKey: "assistantSubtitle" },
  "/architecture": { titleKey: "architectureTitle", subtitleKey: "architectureSubtitle" },
  "/model-lab": { titleKey: "modelLabTitle", subtitleKey: "modelLabSubtitle" },
  "/farm-network": { titleKey: "farmNetworkTitle", subtitleKey: "farmNetworkSubtitle" },
  "/energy": { titleKey: "energyTitle", subtitleKey: "energySubtitle" },
};

function AuthedShell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { t } = useTranslation();
  const { connectionPhase } = useApp();
  const meta = PAGE_META[location.pathname];

  // Block the whole app behind one friendly "connecting" screen while the
  // backend wakes up (see AppContext.jsx / utils/backendReady.js) — once it
  // settles to "ready" (or a real, sustained "error"), render normally.
  // Existing pages already handle loadError themselves, so the "error"
  // phase falls through to the normal shell rather than being caught here.
  if (connectionPhase === "connecting" || connectionPhase === "loading-data") {
    return <ConnectingBlock phase={connectionPhase} />;
  }

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
            <Route path="/automation" element={<AutomationControlPage />} />
            <Route path="/assistant" element={<AssistantPage />} />
            <Route path="/architecture" element={<ArchitecturePage />} />
            <Route path="/model-lab" element={<ModelLabPage />} />
            <Route path="/farm-network" element={<FarmConnectivityPage />} />
            <Route path="/energy" element={<EnergyDashboardPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

// Gates the whole app behind a real login (see AuthContext.jsx). Runs
// above AppProvider/AuthedShell entirely — login doesn't depend on farm
// data, so it must work even before the backend's crops/methods fetch
// settles.
function Root() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    if (location.pathname === "/login") return <LoginPage />;
    return <Navigate to="/login" replace />;
  }

  if (location.pathname === "/login") {
    return <Navigate to="/" replace />;
  }

  return (
    <AppProvider>
      <AuthedShell />
    </AppProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Root />
      </AuthProvider>
    </BrowserRouter>
  );
}
