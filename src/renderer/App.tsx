import React, { useEffect } from "react";
import { useAuthStore } from "./store/authStore";
import { useUIStore } from "./store/uiStore";
import { Sidebar } from "./components/Sidebar";
import { DashboardView } from "./components/DashboardView";
import { KanbanView } from "./components/KanbanView";
import { DevelopersView } from "./components/DevelopersView";
import { HistoryView } from "./components/HistoryView";
import { SettingsView } from "./components/SettingsView";
import { LeadDetailPanel } from "./components/LeadDetailPanel";
import { ToastContainer } from "./components/ToastContainer";
import { UpdateBanner } from "./components/UpdateBanner";
import { useLeadsStore } from "./store/leadsStore";

function App() {
  const { isLoggedIn } = useAuthStore();
  const { activeTab, theme, isFullscreen, exitFullscreen, setUpdateStatus, setUpdateVersion } = useUIStore();
  const { selectedLead, setSelectedLead } = useLeadsStore();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        exitFullscreen();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen, exitFullscreen]);

  // Auto-login as manager (bypass auth for now)
  useEffect(() => {
    if (!isLoggedIn) {
      useAuthStore.setState({
        user: { uid: "manager", displayName: "Manager", role: "manager" },
        isLoggedIn: true,
      });
    }
  }, [isLoggedIn]);

  // Update listeners
  useEffect(() => {
    window.api.update.onChecking(() => setUpdateStatus("checking"));
    window.api.update.onAvailable((data) => {
      setUpdateStatus("available");
      setUpdateVersion(data.version);
    });
    window.api.update.onNotAvailable(() => setUpdateStatus(null));
    window.api.update.onDownloaded((data) => {
      setUpdateStatus("downloaded");
      setUpdateVersion(data.version);
    });
  }, []);

  const renderActiveTab = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardView />;
      case "kanban":
        return <KanbanView />;
      case "developers":
        return <DevelopersView />;
      case "history":
        return <HistoryView />;
      case "settings":
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="app-layout">
      {!isFullscreen && <Sidebar />}
      <div className={`main-content ${isFullscreen ? "fullscreen" : ""}`}>
        <UpdateBanner />
        {renderActiveTab()}
      </div>
      <LeadDetailPanel
        lead={selectedLead}
        isOpen={!!selectedLead}
        onClose={() => setSelectedLead(null)}
      />
      <ToastContainer />
    </div>
  );
}

export default App;
