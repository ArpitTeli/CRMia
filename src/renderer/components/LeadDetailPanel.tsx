import React, { useEffect, useState } from "react";
import { useLeadsStore } from "../store/leadsStore";
import { useDevelopersStore } from "../store/developersStore";
import { useUIStore } from "../store/uiStore";
import { useHistoryStore } from "../store/historyStore";
import { Lead } from "@shared/types";
import { openExternal } from "../services/shellService";

const PIPELINE_STAGES = ["New", "Contacted", "Qualified", "Closed"];
const PRIORITIES = ["High", "Medium", "Low"];

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
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

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

interface LeadDetailPanelProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
}

export function LeadDetailPanel({ lead, isOpen, onClose }: LeadDetailPanelProps) {
  const { updateLeadInStore, assignLead } = useLeadsStore();
  const { developers, fetchDevelopers } = useDevelopersStore();
  const { addToast } = useUIStore();
  const { entries, fetchHistory, logHistory } = useHistoryStore();

  const [assignedTo, setAssignedTo] = useState("");
  const [pipelineStage, setPipelineStage] = useState("");
  const [priority, setPriority] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [managerNotes, setManagerNotes] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (lead && isOpen) {
      setAssignedTo(lead["Assigned To"] || "");
      setPipelineStage(lead["Pipeline Stage"] || "New");
      setPriority(lead.Priority || "");
      setDueDate(lead["Due Date"] || "");
      setManagerNotes(lead["Manager Notes"] || "");
      setHasChanges(false);
      fetchDevelopers();
      fetchHistory(lead.name, lead.website);
    }
  }, [lead, isOpen]);

  useEffect(() => {
    if (!lead) return;
    const changed =
      assignedTo !== (lead["Assigned To"] || "") ||
      pipelineStage !== (lead["Pipeline Stage"] || "New") ||
      priority !== (lead.Priority || "") ||
      dueDate !== (lead["Due Date"] || "") ||
      managerNotes !== (lead["Manager Notes"] || "");
    setHasChanges(changed);
  }, [assignedTo, pipelineStage, priority, dueDate, managerNotes, lead]);

  const handleSave = async () => {
    if (!lead) return;
    setIsSaving(true);

    const success = await assignLead({
      name: lead.name,
      website: lead.website,
      assignedTo,
      pipelineStage,
      priority,
      dueDate,
      managerNotes,
    });

    if (success) {
      await logHistory({
        actionType: "update",
        leadName: lead.name,
        leadWebsite: lead.website,
        oldValue: JSON.stringify({
          assignedTo: lead["Assigned To"],
          pipelineStage: lead["Pipeline Stage"],
          priority: lead.Priority,
          dueDate: lead["Due Date"],
          managerNotes: lead["Manager Notes"],
        }),
        newValue: JSON.stringify({
          assignedTo,
          pipelineStage,
          priority,
          dueDate,
          managerNotes,
        }),
        notes: "Lead updated by manager",
      });
      addToast("Lead updated successfully", "success");
      setHasChanges(false);
    } else {
      addToast("Failed to update lead", "error");
    }

    setIsSaving(false);
  };

  if (!lead) return null;

  return (
    <>
      <div
        className={`side-panel-overlay ${isOpen ? "" : ""}`}
        style={{ opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? "auto" : "none" }}
        onClick={onClose}
      />
      <div className={`side-panel ${isOpen ? "open" : ""}`}>
        <div className="side-panel-header">
          <div className="side-panel-header-info">
            <div className="side-panel-title">{lead.name}</div>
            <div className="side-panel-subtitle">
              <span
                className="link"
                onClick={() => openExternal(lead.website)}
                style={{ cursor: "pointer" }}
              >
                {lead.website?.replace(/^https?:\/\//, "")}
              </span>
            </div>
            <div className="side-panel-badges">
              <span className={getPipelineBadgeClass(pipelineStage)}>
                {pipelineStage || "New"}
              </span>
              {priority && (
                <span className={getPriorityBadgeClass(priority)}>
                  {priority}
                </span>
              )}
              {lead["Lead Status"] && (
                <span className={getStatusBadgeClass(lead["Lead Status"])}>
                  {lead["Lead Status"]}
                </span>
              )}
            </div>
          </div>
          <div className="side-panel-actions">
            <button className="btn btn-secondary btn-sm" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        <div className="side-panel-body">
          <div className="side-panel-section">
            <div className="side-panel-section-title">Basic Info</div>
            <div className="side-panel-field">
              <span className="side-panel-field-label">Query</span>
              <span className="side-panel-field-value">{lead.query || "—"}</span>
            </div>
            <div className="side-panel-field">
              <span className="side-panel-field-label">Phone</span>
              <span className="side-panel-field-value">
                {lead.company_phone || "—"}
              </span>
            </div>
            <div className="side-panel-field">
              <span className="side-panel-field-label">Email</span>
              <span className="side-panel-field-value">
                {lead.email ? (
                  <a href={`mailto:${lead.email}`}>{lead.email}</a>
                ) : (
                  "—"
                )}
              </span>
            </div>
            <div className="side-panel-field">
              <span className="side-panel-field-label">Pushed By</span>
              <span className="side-panel-field-value">
                {lead.pushed_by || "—"}
              </span>
            </div>
            <div className="side-panel-field">
              <span className="side-panel-field-label">Created At</span>
              <span className="side-panel-field-value">
                {formatDateTime(lead["Created At"])}
              </span>
            </div>
            <div className="side-panel-field">
              <span className="side-panel-field-label">Updated At</span>
              <span className="side-panel-field-value">
                {formatDateTime(lead["Updated At"])}
              </span>
            </div>
          </div>

          <div className="side-panel-section">
            <div className="side-panel-section-title">Comments</div>
            <div className="side-panel-field">
              <span className="side-panel-field-label">Qualifier Comments</span>
              <div
                className="side-panel-field-value"
                style={{ whiteSpace: "pre-wrap" }}
              >
                {lead.Comments || "—"}
              </div>
            </div>
            <div className="side-panel-field">
              <span className="side-panel-field-label">Developer Comments</span>
              <div
                className="side-panel-field-value"
                style={{ whiteSpace: "pre-wrap" }}
              >
                {lead["Developer Comments"] || "—"}
              </div>
            </div>
          </div>

          <div className="side-panel-section">
            <div className="side-panel-section-title">Management</div>
            <div className="side-panel-editable">
              <label>Assigned To</label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
              >
                <option value="">Unassigned</option>
                {developers.map((d) => (
                  <option key={d.uid} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="side-panel-editable">
              <label>Pipeline Stage</label>
              <select
                value={pipelineStage}
                onChange={(e) => setPipelineStage(e.target.value)}
              >
                {PIPELINE_STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="side-panel-editable">
              <label>Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="">None</option>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div className="side-panel-editable">
              <label>Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="side-panel-editable">
              <label>Manager Notes</label>
              <textarea
                value={managerNotes}
                onChange={(e) => setManagerNotes(e.target.value)}
                placeholder="Add notes about this lead..."
              />
            </div>
          </div>

          <div className="side-panel-section">
            <div className="side-panel-section-title">Activity History</div>
            {entries.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
                No activity recorded yet.
              </p>
            ) : (
              <div className="history-timeline">
                {entries.map((entry, i) => (
                  <div key={i} className="history-entry">
                    <div className="history-entry-dot" />
                    <div className="history-entry-content">
                      <div className="history-entry-action">
                        <strong>{entry.userName}</strong>{" "}
                        {entry.actionType.replace(/_/g, " ")}
                      </div>
                      {entry.oldValue && entry.newValue && (
                        <div className="history-entry-detail">
                          {entry.oldValue} → {entry.newValue}
                        </div>
                      )}
                      {entry.notes && (
                        <div className="history-entry-detail">
                          {entry.notes}
                        </div>
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
        </div>

        <div className="side-panel-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
          >
            {isSaving ? (
              <span className="spinner" style={{ width: 16, height: 16 }} />
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </>
  );
}
