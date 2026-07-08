import React, { useEffect, useState, useRef } from "react";
import { useLeadsStore } from "../store/leadsStore";
import { useUIStore } from "../store/uiStore";
import { useHistoryStore } from "../store/historyStore";
import { Lead } from "@shared/types";

const PIPELINE_STAGES = ["New", "Contacted", "Qualified", "Closed"];

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

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
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

export function KanbanView() {
  const { leads, isLoading, fetchLeads, updateLeadInStore } = useLeadsStore();
  const { addToast } = useUIStore();
  const { logHistory } = useHistoryStore();
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  const getLeadsForStage = (stage: string) =>
    leads
      .filter((l) => (l["Pipeline Stage"] || "New") === stage)
      .sort((a, b) => {
        const priorityOrder = { High: 0, Medium: 1, Low: 2 };
        const aP = priorityOrder[a.Priority as keyof typeof priorityOrder] ?? 3;
        const bP = priorityOrder[b.Priority as keyof typeof priorityOrder] ?? 3;
        return aP - bP;
      });

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(stage);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (!draggedLead || draggedLead["Pipeline Stage"] === stage) {
      setDraggedLead(null);
      return;
    }

    const oldStage = draggedLead["Pipeline Stage"] || "New";
    updateLeadInStore(draggedLead.name, draggedLead.website, {
      "Pipeline Stage": stage,
    });

    try {
      const result = await useLeadsStore.getState().updatePipeline({
        name: draggedLead.name,
        website: draggedLead.website,
        pipelineStage: stage,
        priority: draggedLead.Priority || "",
        managerNotes: draggedLead["Manager Notes"] || "",
      });

      if (result) {
        await logHistory({
          actionType: "stage_change",
          leadName: draggedLead.name,
          leadWebsite: draggedLead.website,
          oldValue: oldStage,
          newValue: stage,
          notes: `Moved from ${oldStage} to ${stage} via Kanban`,
        });
        addToast(`Lead moved to ${stage}`, "success");
      } else {
        updateLeadInStore(draggedLead.name, draggedLead.website, {
          "Pipeline Stage": oldStage,
        });
        addToast("Failed to update pipeline stage", "error");
      }
    } catch {
      updateLeadInStore(draggedLead.name, draggedLead.website, {
        "Pipeline Stage": oldStage,
      });
      addToast("Failed to update pipeline stage", "error");
    }

    setDraggedLead(null);
  };

  const handleDragEnd = () => {
    setDraggedLead(null);
    setDragOverColumn(null);
  };

  if (isLoading) {
    return (
      <div className="empty-state">
        <div className="spinner spinner-lg" />
        <p className="empty-state-text" style={{ marginTop: 16 }}>
          Loading kanban...
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="page-header">
        <h2 className="page-title">Pipeline</h2>
        <button className="btn btn-secondary btn-sm" onClick={() => fetchLeads()}>
          Refresh
        </button>
      </div>

      <div className="kanban-container">
        {PIPELINE_STAGES.map((stage) => {
          const stageLeads = getLeadsForStage(stage);
          return (
            <div key={stage} className="kanban-column">
              <div className="kanban-column-header">
                <span className="kanban-column-title">{stage}</span>
                <span className="kanban-column-count">{stageLeads.length}</span>
              </div>
              <div
                className={`kanban-column-body ${
                  dragOverColumn === stage ? "drag-over" : ""
                }`}
                onDragOver={(e) => handleDragOver(e, stage)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, stage)}
              >
                {stageLeads.map((lead) => (
                  <div
                    key={`${lead.name}-${lead.website}`}
                    className={`kanban-card ${
                      draggedLead?.name === lead.name ? "dragging" : ""
                    }`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="kanban-card-name">{lead.name}</div>
                    <div className="kanban-card-website">
                      {lead.website?.replace(/^https?:\/\//, "").slice(0, 35)}
                    </div>
                    <div className="kanban-card-meta">
                      <span className="kanban-card-dev">
                        {lead["Assigned To"] || "Unassigned"}
                      </span>
                      {lead.Priority && (
                        <span className={getPriorityBadgeClass(lead.Priority)}>
                          {lead.Priority}
                        </span>
                      )}
                    </div>
                    {lead["Due Date"] && (
                      <div
                        className={`kanban-card-due ${
                          isOverdue(lead["Due Date"]) ? "overdue" : ""
                        }`}
                        style={{ marginTop: 6, fontSize: 11 }}
                      >
                        Due: {formatDate(lead["Due Date"])}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
