import React, { useEffect, useState } from "react";
import { useHistoryStore } from "../store/historyStore";
import { useLeadsStore } from "../store/leadsStore";
import { useUIStore } from "../store/uiStore";
import { HistoryEntry } from "@shared/types";

const ACTION_TYPES = [
  "assign",
  "reassign",
  "unassign",
  "stage_change",
  "priority_change",
  "notes_edit",
  "due_date_change",
  "update",
];

function formatDateTime(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function formatActionType(action: string): string {
  return action
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function HistoryView() {
  const { leads, fetchLeads } = useLeadsStore();
  const { addToast } = useUIStore();
  const [allHistory, setAllHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    actionType: "",
    userName: "",
    leadName: "",
  });

  useEffect(() => {
    fetchAllHistory();
  }, []);

  const fetchAllHistory = async () => {
    setIsLoading(true);
    await fetchLeads();

    const { getHistory } = await import("../services/historyService");
    const allEntries: HistoryEntry[] = [];

    for (const lead of leads.slice(0, 50)) {
      try {
        const result = await getHistory(lead.name, lead.website);
        if (result.success && result.history) {
          allEntries.push(...(result.history as HistoryEntry[]));
        }
      } catch {
        // Skip failed leads
      }
    }

    allEntries.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    setAllHistory(allEntries);
    setIsLoading(false);
  };

  const filteredHistory = allHistory.filter((entry) => {
    if (filters.actionType && entry.actionType !== filters.actionType)
      return false;
    if (
      filters.userName &&
      !entry.userName.toLowerCase().includes(filters.userName.toLowerCase())
    )
      return false;
    if (
      filters.leadName &&
      !entry.leadName.toLowerCase().includes(filters.leadName.toLowerCase())
    )
      return false;
    return true;
  });

  const uniqueUsers = [...new Set(allHistory.map((e) => e.userName))].filter(
    Boolean
  );

  return (
    <div className="history-container">
      <div className="page-header">
        <h2 className="page-title">Activity History</h2>
        <button
          className="btn btn-secondary btn-sm"
          onClick={fetchAllHistory}
        >
          Refresh
        </button>
      </div>

      <div className="table-toolbar" style={{ padding: "12px 0" }}>
        <input
          type="text"
          className="form-input"
          placeholder="Search by lead name..."
          value={filters.leadName}
          onChange={(e) =>
            setFilters((f) => ({ ...f, leadName: e.target.value }))
          }
          style={{ width: 200 }}
        />
        <select
          className="form-input"
          value={filters.actionType}
          onChange={(e) =>
            setFilters((f) => ({ ...f, actionType: e.target.value }))
          }
        >
          <option value="">All Actions</option>
          {ACTION_TYPES.map((a) => (
            <option key={a} value={a}>
              {formatActionType(a)}
            </option>
          ))}
        </select>
        <select
          className="form-input"
          value={filters.userName}
          onChange={(e) =>
            setFilters((f) => ({ ...f, userName: e.target.value }))
          }
        >
          <option value="">All Users</option>
          {uniqueUsers.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="empty-state">
          <div className="spinner spinner-lg" />
          <p className="empty-state-text" style={{ marginTop: 16 }}>
            Loading history...
          </p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📜</div>
          <h3 className="empty-state-title">No history found</h3>
          <p className="empty-state-text">
            {allHistory.length === 0
              ? "No activity has been recorded yet."
              : "No entries match your filters."}
          </p>
        </div>
      ) : (
        <div className="history-timeline">
          {filteredHistory.map((entry, i) => (
            <div key={i} className="history-entry">
              <div className="history-entry-dot" />
              <div className="history-entry-content">
                <div className="history-entry-action">
                  <strong>{entry.userName}</strong>{" "}
                  {formatActionType(entry.actionType)}{" "}
                  <span style={{ color: "var(--text-link)" }}>
                    {entry.leadName}
                  </span>
                </div>
                {entry.oldValue && entry.newValue && (
                  <div className="history-entry-detail">
                    {entry.oldValue.length > 50
                      ? entry.oldValue.slice(0, 50) + "..."
                      : entry.oldValue}{" "}
                    →{" "}
                    {entry.newValue.length > 50
                      ? entry.newValue.slice(0, 50) + "..."
                      : entry.newValue}
                  </div>
                )}
                {entry.notes && (
                  <div className="history-entry-detail">{entry.notes}</div>
                )}
                <div className="history-entry-time">
                  {formatDateTime(entry.timestamp)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
