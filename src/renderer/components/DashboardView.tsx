import React, { useEffect, useState, useMemo } from "react";
import { useLeadsStore } from "../store/leadsStore";
import { useDevelopersStore } from "../store/developersStore";
import { useUIStore } from "../store/uiStore";
import { Lead } from "@shared/types";
import { openExternal } from "../services/shellService";

const PIPELINE_STAGES = ["New", "Contacted", "Qualified", "Closed"];
const PRIORITIES = ["High", "Medium", "Low"];

const ALL_COLUMNS = [
  { key: "query", label: "Query", visible: true },
  { key: "name", label: "Name", visible: true },
  { key: "website", label: "Website", visible: true },
  { key: "company_phone", label: "Phone", visible: false },
  { key: "email", label: "Email", visible: false },
  { key: "pushed_by", label: "Pushed By", visible: false },
  { key: "Comments", label: "Comments", visible: false },
  { key: "Lead Status", label: "Status", visible: true },
  { key: "Assigned To", label: "Assigned To", visible: true },
  { key: "Pipeline Stage", label: "Pipeline", visible: true },
  { key: "Priority", label: "Priority", visible: true },
  { key: "Manager Notes", label: "Notes", visible: false },
  { key: "Task Status", label: "Task Status", visible: false },
  { key: "Developer Comments", label: "Dev Comments", visible: false },
  { key: "Due Date", label: "Due Date", visible: true },
  { key: "Created At", label: "Created At", visible: true },
  { key: "Updated At", label: "Updated At", visible: false },
];

function getPriorityBadgeClass(priority: string): string {
  switch (priority?.toLowerCase()) {
    case "high":
      return "badge badge-high";
    case "medium":
      return "badge badge-medium";
    case "low":
      return "badge badge-low";
    default:
      return "badge";
  }
}

function getPipelineBadgeClass(stage: string): string {
  switch (stage?.toLowerCase()) {
    case "new":
      return "badge badge-new";
    case "contacted":
      return "badge badge-contacted";
    case "qualified":
      return "badge badge-qualified";
    case "closed":
      return "badge badge-closed";
    default:
      return "badge";
  }
}

function getStatusBadgeClass(status: string): string {
  switch (status?.toLowerCase()) {
    case "good":
      return "badge badge-good";
    case "maybe":
      return "badge badge-maybe";
    case "bad":
      return "badge badge-bad";
    default:
      return "badge";
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function isOverdue(dateStr: string): boolean {
  if (!dateStr) return false;
  try {
    return new Date(dateStr) < new Date();
  } catch {
    return false;
  }
}

export function DashboardView() {
  const {
    leads,
    isLoading,
    filters,
    sortConfig,
    fetchLeads,
    setFilter,
    clearFilters,
    setSort,
    setSelectedLead,
  } = useLeadsStore();
  const { developers, fetchDevelopers } = useDevelopersStore();
  const { addToast } = useUIStore();
  const [columns, setColumns] = useState(ALL_COLUMNS);
  const [showColumnPicker, setShowColumnPicker] = useState(false);

  useEffect(() => {
    fetchLeads();
    fetchDevelopers();
  }, []);

  const filteredAndSortedLeads = useMemo(() => {
    let result = [...leads];

    if (filters.pipelineStage) {
      result = result.filter(
        (l) => l["Pipeline Stage"] === filters.pipelineStage
      );
    }
    if (filters.assignedTo) {
      if (filters.assignedTo === "__unassigned__") {
        result = result.filter((l) => !l["Assigned To"]);
      } else {
        result = result.filter((l) => l["Assigned To"] === filters.assignedTo);
      }
    }
    if (filters.priority) {
      result = result.filter((l) => l.Priority === filters.priority);
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(
        (l) =>
          l.name?.toLowerCase().includes(search) ||
          l.website?.toLowerCase().includes(search) ||
          l.query?.toLowerCase().includes(search) ||
          l.Comments?.toLowerCase().includes(search)
      );
    }

    result.sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortConfig.key] || "";
      const bVal = (b as Record<string, unknown>)[sortConfig.key] || "";
      const comparison = String(aVal).localeCompare(String(bVal));
      return sortConfig.direction === "asc" ? comparison : -comparison;
    });

    return result;
  }, [leads, filters, sortConfig]);

  const visibleColumns = columns.filter((c) => c.visible);

  const toggleColumn = (key: string) => {
    setColumns((prev) =>
      prev.map((c) => (c.key === key ? { ...c, visible: !c.visible } : c))
    );
  };

  const renderCellValue = (lead: Lead, key: string) => {
    const value = (lead as Record<string, unknown>)[key] as string;

    switch (key) {
      case "name":
        return (
          <span
            className="link"
            onClick={() => setSelectedLead(lead)}
          >
            {value || "—"}
          </span>
        );
      case "website":
        return value ? (
          <span
            className="link"
            onClick={() => openExternal(value)}
          >
            {value.replace(/^https?:\/\//, "").slice(0, 30)}
          </span>
        ) : (
          "—"
        );
      case "Pipeline Stage":
        return value ? (
          <span className={getPipelineBadgeClass(value)}>{value}</span>
        ) : (
          <span className="badge" style={{ opacity: 0.4 }}>
            New
          </span>
        );
      case "Priority":
        return value ? (
          <span className={getPriorityBadgeClass(value)}>{value}</span>
        ) : (
          "—"
        );
      case "Lead Status":
        return value ? (
          <span className={getStatusBadgeClass(value)}>{value}</span>
        ) : (
          "—"
        );
      case "Assigned To":
        return value || (
          <span style={{ color: "var(--text-muted)" }}>Unassigned</span>
        );
      case "Due Date":
        return value ? (
          <span className={isOverdue(value) ? "kanban-card-due overdue" : ""}>
            {formatDate(value)}
          </span>
        ) : (
          "—"
        );
      case "Created At":
      case "Updated At":
        return formatDate(value);
      case "Comments":
      case "Manager Notes":
      case "Developer Comments":
        return value ? (
          <span title={value}>{value.slice(0, 30)}{value.length > 30 ? "..." : ""}</span>
        ) : (
          "—"
        );
      default:
        return value || "—";
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="page-header">
        <h2 className="page-title">Dashboard</h2>
        <div style={{ display: "flex", gap: "8px" }}>
          <button className="btn btn-secondary btn-sm" onClick={() => fetchLeads()}>
            Refresh
          </button>
        </div>
      </div>

      <div className="table-toolbar">
        <div className="table-toolbar-left">
          <input
            type="text"
            className="form-input search-input"
            placeholder="Search leads..."
            value={filters.search}
            onChange={(e) => setFilter("search", e.target.value)}
          />
          <select
            className="form-input filter-select"
            value={filters.pipelineStage}
            onChange={(e) => setFilter("pipelineStage", e.target.value)}
          >
            <option value="">All Stages</option>
            {PIPELINE_STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            className="form-input filter-select"
            value={filters.assignedTo}
            onChange={(e) => setFilter("assignedTo", e.target.value)}
          >
            <option value="">All Developers</option>
            <option value="__unassigned__">Unassigned</option>
            {developers.map((d) => (
              <option key={d.uid} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
          <select
            className="form-input filter-select"
            value={filters.priority}
            onChange={(e) => setFilter("priority", e.target.value)}
          >
            <option value="">All Priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          {(filters.pipelineStage || filters.assignedTo || filters.priority || filters.search) && (
            <button className="btn btn-secondary btn-sm" onClick={clearFilters}>
              Clear Filters
            </button>
          )}
        </div>
        <div className="table-toolbar-right">
          <div style={{ position: "relative" }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowColumnPicker(!showColumnPicker)}
            >
              Columns
            </button>
            {showColumnPicker && (
              <div
                className="context-menu"
                style={{ top: "100%", right: 0, marginTop: 4 }}
              >
                {columns.map((col) => (
                  <button
                    key={col.key}
                    className="context-menu-item"
                    onClick={() => toggleColumn(col.key)}
                  >
                    <span style={{ opacity: col.visible ? 1 : 0.3 }}>
                      {col.visible ? "✓" : "○"}
                    </span>
                    {col.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="table-container">
        {isLoading ? (
          <div className="empty-state">
            <div className="spinner spinner-lg" />
            <p className="empty-state-text" style={{ marginTop: 16 }}>
              Loading leads...
            </p>
          </div>
        ) : filteredAndSortedLeads.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3 className="empty-state-title">
              {leads.length === 0
                ? "No leads yet"
                : "No leads match your filters"}
            </h3>
            <p className="empty-state-text">
              {leads.length === 0
                ? "They will appear here once qualifiers push them."
                : "Try adjusting your filters."}
            </p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                {visibleColumns.map((col) => (
                  <th key={col.key} onClick={() => setSort(col.key)}>
                    {col.label}
                    <span
                      className={`sort-icon ${
                        sortConfig.key === col.key ? "active" : ""
                      }`}
                    >
                      {sortConfig.key === col.key
                        ? sortConfig.direction === "asc"
                          ? " ↑"
                          : " ↓"
                        : ""}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedLeads.map((lead, i) => (
                <tr key={`${lead.name}-${lead.website}-${i}`}>
                  {visibleColumns.map((col) => (
                    <td
                      key={col.key}
                      className={
                        col.key === "name" || col.key === "website" ? "link" : ""
                      }
                    >
                      {renderCellValue(lead, col.key)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
