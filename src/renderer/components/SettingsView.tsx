import React from "react";
import { useUIStore } from "../store/uiStore";

export function SettingsView() {
  const { theme, setTheme } = useUIStore();

  return (
    <div className="settings-container">
      <div className="page-header" style={{ padding: "0 0 16px 0" }}>
        <h2 className="page-title">Settings</h2>
      </div>

      <div className="settings-section">
        <h3 className="settings-section-title">Appearance</h3>
        <div className="settings-card">
          <div className="theme-toggle">
            <span className="theme-toggle-label">Dark Mode</span>
            <div
              className={`theme-toggle-switch ${theme === "dark" ? "active" : ""}`}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            />
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3 className="settings-section-title">Google Sheets</h3>
        <div className="settings-card">
          <div className="side-panel-field">
            <span className="side-panel-field-label">Auth Sheet ID</span>
            <span
              className="side-panel-field-value"
              style={{ fontSize: 12, fontFamily: "monospace" }}
            >
              1HLBEiQ-tGaTdm4Lq6JltGcfBIWcgc528-JKSD4gON2Q
            </span>
          </div>
          <div className="side-panel-field">
            <span className="side-panel-field-label">Shared Leads Sheet ID</span>
            <span
              className="side-panel-field-value"
              style={{ fontSize: 12, fontFamily: "monospace" }}
            >
              1LWsb7dfw5vQ3DZcLgmN523ALoys9hqYfmft6v-bA9kU
            </span>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3 className="settings-section-title">About</h3>
        <div className="settings-card">
          <div className="side-panel-field">
            <span className="side-panel-field-label">Version</span>
            <span className="side-panel-field-value">1.0.0</span>
          </div>
          <div className="side-panel-field">
            <span className="side-panel-field-label">Updater</span>
            <span
              className="side-panel-field-value"
              style={{ color: "var(--text-muted)" }}
            >
              Coming soon
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
