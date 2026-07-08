import React, { useEffect, useState } from "react";
import { useDevelopersStore } from "../store/developersStore";
import { useLeadsStore } from "../store/leadsStore";
import { useUIStore } from "../store/uiStore";
import { useHistoryStore } from "../store/historyStore";
import { Lead, Developer } from "@shared/types";

export function DevelopersView() {
  const { developers, isLoading, fetchDevelopers, addDeveloper, removeDeveloper } =
    useDevelopersStore();
  const { leads, fetchLeads, assignLead } = useLeadsStore();
  const { logHistory } = useHistoryStore();
  const { addToast } = useUIStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [draggedLead, setDraggedLead] = useState<{
    lead: Lead;
    fromDev: string;
  } | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    lead: Lead;
    fromDev: string;
  } | null>(null);

  useEffect(() => {
    fetchDevelopers();
    fetchLeads();
  }, []);

  const getLeadsForDev = (devName: string) =>
    leads.filter((l) => l["Assigned To"] === devName);

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const handleLeadDragStart = (
    e: React.DragEvent,
    lead: Lead,
    fromDev: string
  ) => {
    setDraggedLead({ lead, fromDev });
    e.dataTransfer.effectAllowed = "move";
  };

  const handleCardDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleCardDrop = async (e: React.DragEvent, targetDev: string) => {
    e.preventDefault();
    if (!draggedLead || draggedLead.fromDev === targetDev) {
      setDraggedLead(null);
      return;
    }

    const oldDev = draggedLead.fromDev;
    const lead = draggedLead.lead;

    const success = await assignLead({
      name: lead.name,
      website: lead.website,
      assignedTo: targetDev,
      pipelineStage: lead["Pipeline Stage"] || "New",
      priority: lead.Priority || "",
      dueDate: lead["Due Date"] || "",
      managerNotes: lead["Manager Notes"] || "",
    });

    if (success) {
      await logHistory({
        actionType: "reassign",
        leadName: lead.name,
        leadWebsite: lead.website,
        oldValue: oldDev,
        newValue: targetDev,
        notes: `Reassigned from ${oldDev} to ${targetDev}`,
      });
      addToast(`Lead assigned to ${targetDev}`, "success");
    } else {
      addToast("Failed to reassign lead", "error");
    }

    setDraggedLead(null);
  };

  const handleLeadContextMenu = (
    e: React.MouseEvent,
    lead: Lead,
    fromDev: string
  ) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, lead, fromDev });
  };

  const handleUnassign = async () => {
    if (!contextMenu) return;
    const { lead, fromDev } = contextMenu;

    const success = await assignLead({
      name: lead.name,
      website: lead.website,
      assignedTo: "",
      pipelineStage: lead["Pipeline Stage"] || "New",
      priority: lead.Priority || "",
      dueDate: lead["Due Date"] || "",
      managerNotes: lead["Manager Notes"] || "",
    });

    if (success) {
      await logHistory({
        actionType: "unassign",
        leadName: lead.name,
        leadWebsite: lead.website,
        oldValue: fromDev,
        newValue: "",
        notes: `Unassigned from ${fromDev}`,
      });
      addToast("Lead unassigned", "success");
    } else {
      addToast("Failed to unassign lead", "error");
    }

    setContextMenu(null);
  };

  const handleReassignFromContext = async (targetDev: string) => {
    if (!contextMenu) return;
    const { lead, fromDev } = contextMenu;

    const success = await assignLead({
      name: lead.name,
      website: lead.website,
      assignedTo: targetDev,
      pipelineStage: lead["Pipeline Stage"] || "New",
      priority: lead.Priority || "",
      dueDate: lead["Due Date"] || "",
      managerNotes: lead["Manager Notes"] || "",
    });

    if (success) {
      await logHistory({
        actionType: "reassign",
        leadName: lead.name,
        leadWebsite: lead.website,
        oldValue: fromDev,
        newValue: targetDev,
        notes: `Reassigned from ${fromDev} to ${targetDev}`,
      });
      addToast(`Lead assigned to ${targetDev}`, "success");
    } else {
      addToast("Failed to reassign lead", "error");
    }

    setContextMenu(null);
  };

  const handleRemoveDeveloper = async (dev: Developer) => {
    if (!confirm(`Remove ${dev.name} from the roster?`)) return;
    const success = await removeDeveloper(dev.uid);
    if (success) {
      addToast(`${dev.name} removed from roster`, "success");
    } else {
      addToast("Failed to remove developer", "error");
    }
  };

  return (
    <div className="dev-container" onClick={() => setContextMenu(null)}>
      <div className="dev-header">
        <h2 className="page-title">Developers</h2>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setShowAddModal(true)}
        >
          + Add Developer
        </button>
      </div>

      {isLoading ? (
        <div className="empty-state">
          <div className="spinner spinner-lg" />
        </div>
      ) : developers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <h3 className="empty-state-title">No developers yet</h3>
          <p className="empty-state-text">
            Add developers to start assigning leads.
          </p>
        </div>
      ) : (
        <div className="dev-grid">
          {developers.map((dev) => {
            const devLeads = getLeadsForDev(dev.name);
            return (
              <div
                key={dev.uid}
                className={`dev-card dev-drop-zone ${
                  draggedLead && draggedLead.fromDev !== dev.name ? "active" : ""
                }`}
                onDragOver={handleCardDragOver}
                onDrop={(e) => handleCardDrop(e, dev.name)}
              >
                <div className="dev-card-header">
                  <div className="dev-avatar">{getInitials(dev.name)}</div>
                  <div className="dev-info">
                    <div className="dev-name">{dev.name}</div>
                    <div className="dev-specialization">
                      {dev.specialization}
                    </div>
                  </div>
                </div>

                <div className="dev-lead-count">
                  {devLeads.length} lead{devLeads.length !== 1 ? "s" : ""} assigned
                </div>

                <div className="dev-lead-icons">
                  {devLeads.map((lead) => (
                    <div
                      key={`${lead.name}-${lead.website}`}
                      className={`dev-lead-icon ${
                        draggedLead?.lead.name === lead.name ? "dragging" : ""
                      }`}
                      draggable
                      onDragStart={(e) =>
                        handleLeadDragStart(e, lead, dev.name)
                      }
                      onContextMenu={(e) =>
                        handleLeadContextMenu(e, lead, dev.name)
                      }
                      title={`${lead.name} - ${lead.website}`}
                    >
                      {lead.name?.[0]?.toUpperCase() || "?"}
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 12 }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ width: "100%" }}
                    onClick={() => handleRemoveDeveloper(dev)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAddModal && (
        <AddDeveloperModal onClose={() => setShowAddModal(false)} />
      )}

      {contextMenu && (
        <div
          className="context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="context-menu-item danger" onClick={handleUnassign}>
            Remove from Developer
          </button>
          <div className="context-menu-divider" />
          {developers
            .filter((d) => d.name !== contextMenu.fromDev)
            .map((d) => (
              <button
                key={d.uid}
                className="context-menu-item"
                onClick={() => handleReassignFromContext(d.name)}
              >
                Add to {d.name}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

function AddDeveloperModal({ onClose }: { onClose: () => void }) {
  const { addDeveloper } = useDevelopersStore();
  const { addToast } = useUIStore();
  const [uid, setUid] = useState("");
  const [name, setName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [email, setEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid.trim() || !name.trim()) return;

    setIsSaving(true);
    const success = await addDeveloper({
      uid: uid.trim(),
      name: name.trim(),
      specialization: specialization.trim(),
      email: email.trim(),
    });
    setIsSaving(false);

    if (success) {
      addToast(`${name} added to roster`, "success");
      onClose();
    } else {
      addToast("Failed to add developer", "error");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">Add Developer</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label">UID *</label>
            <input
              type="text"
              className="form-input"
              value={uid}
              onChange={(e) => setUid(e.target.value)}
              placeholder="Unique identifier"
              required
            />
          </div>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label">Display Name *</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              required
            />
          </div>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label">Specialization</label>
            <input
              type="text"
              className="form-input"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              placeholder="e.g. Frontend, Backend"
            />
          </div>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
            />
          </div>
          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSaving || !uid.trim() || !name.trim()}
            >
              {isSaving ? (
                <span className="spinner" style={{ width: 16, height: 16 }} />
              ) : (
                "Add Developer"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
