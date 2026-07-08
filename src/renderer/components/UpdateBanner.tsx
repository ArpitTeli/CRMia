import React from "react";
import { useUIStore } from "../store/uiStore";

export function UpdateBanner() {
  const { updateStatus, updateVersion, updateDismissed, dismissUpdate } =
    useUIStore();

  if (
    !updateStatus ||
    updateStatus === "checking" ||
    (updateDismissed && updateStatus !== "downloaded")
  ) {
    return null;
  }

  const handleInstall = () => {
    window.api.update.install();
  };

  return (
    <div
      style={{
        backgroundColor: "rgba(74, 222, 128, 0.1)",
        borderBottom: "1px solid rgba(74, 222, 128, 0.3)",
        padding: "8px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontSize: 13,
        color: "#4ade80",
        flexShrink: 0,
      }}
    >
      <span>
        {updateStatus === "available" &&
          `Update available (v${updateVersion}) — downloading...`}
        {updateStatus === "downloaded" &&
          `Update ready (v${updateVersion})`}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {updateStatus === "downloaded" && (
          <button
            onClick={handleInstall}
            style={{
              backgroundColor: "#4ade80",
              color: "#0f172a",
              border: "none",
              borderRadius: 6,
              padding: "4px 12px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Restart Now
          </button>
        )}
        <button
          onClick={dismissUpdate}
          style={{
            background: "none",
            border: "none",
            color: "#4ade80",
            cursor: "pointer",
            fontSize: 16,
            padding: "0 4px",
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
