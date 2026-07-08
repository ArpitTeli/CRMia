# Manager CRM — Specification

## Overview
Electron desktop app for managers. Reads leads pushed by qualifiers from the shared Google Sheet, manages the sales pipeline, and assigns tasks to developers.

---

## Auth

**Auth Google Sheet:** `1HLBEiQ-tGaTdm4Lq6JltGcfBIWcgc528-JKSD4gON2Q`
**Auth Apps Script URL:** `https://script.google.com/macros/s/AKfycbyhkpWsu7OoZrYFdAZxJZ74h0HYp0EkzNP21iCID9UHQBGc-Ugchx3m6M60GkTgDv8dtQ/exec`

| Column | Purpose |
|--------|---------|
| `UID` | User ID |
| `Pass` | Password |
| `Role` | `qualifier`, `manager`, or `developer` |

Login POST:
```json
{ "action": "login", "uid": "...", "password": "..." }
Response: { "success": true, "displayName": "..." }
```

CRM app should check that the logged-in user's role is `manager`. Reject other roles.

---

## Shared Google Sheet

**Sheet ID:** `1LWsb7dfw5vQ3DZcLgmN523ALoys9hqYfmft6v-bA9kU`
**Sheet URL:** `https://docs.google.com/spreadsheets/d/1LWsb7dfw5vQ3DZcLgmN523ALoys9hqYfmft6v-bA9kU/edit?usp=sharing`

### Columns Written by Quali (existing)

| Column | Written By | Description |
|--------|-----------|-------------|
| `query` | Qualifier | Search query / lead source |
| `name` | Qualifier | Company or lead name |
| `website` | Qualifier | Website URL |
| `company_phone` | Qualifier | Phone number (+91 prefix stripped) |
| `email` | Qualifier | Contact email |
| `pushed_by` | Qualifier | Display name of the qualifier who pushed |
| `Comments` | Qualifier | Free-text comments from qualifier |
| `Lead Status` | Qualifier | Empty on push (Qualifier tags Good/Maybe/Bad locally) |

### Columns Added by CRM (new)

| Column | Written By | Description |
|--------|-----------|-------------|
| `Assigned To` | Manager | UID or name of the developer this lead is assigned to |
| `Pipeline Stage` | Manager | Current stage in the pipeline (e.g. New, Contacted, Qualified, Closed) |
| `Priority` | Manager | Priority level (e.g. High, Medium, Low) |
| `Manager Notes` | Manager | Free-text notes from the manager |
| `Task Status` | Developer | Current task status (e.g. To Do, In Progress, Review, Done) |
| `Developer Comments` | Developer | Free-text comments from the developer |
| `Due Date` | Manager | Due date for the task |
| `Created At` | System | Timestamp when the lead was pushed |
| `Updated At` | System | Timestamp of last update |

---

## Data Flow

```
Qualifier (Quali)
  │
  │  pushes lead to shared sheet
  │  (query, name, website, phone, email, pushed_by, Comments)
  │
  ▼
Shared Google Sheet
  │
  │  CRM reads all leads
  │
  ▼
Manager (CRM)
  │
  │  assigns lead to developer
  │  sets Pipeline Stage, Priority, Due Date
  │  writes: Assigned To, Pipeline Stage, Priority, Manager Notes, Due Date
  │
  ▼
Shared Google Sheet
  │
  │  Dev Board reads leads where Assigned To = current user
  │
  ▼
Developer (Dev Board)
  │
  │  updates Task Status, Developer Comments
  │
  ▼
Shared Google Sheet (CRM reads back status)
```

---

## CRM Apps Script Endpoints

The CRM needs its own Apps Script deployment (separate from Quali's push script).

### POST — List All Leads

```json
Request: { "action": "listLeads" }
Response: {
  "success": true,
  "leads": [
    {
      "query": "...",
      "name": "...",
      "website": "...",
      "company_phone": "...",
      "email": "...",
      "pushed_by": "...",
      "Comments": "...",
      "Lead Status": "",
      "Assigned To": "",
      "Pipeline Stage": "New",
      "Priority": "",
      "Manager Notes": "",
      "Task Status": "",
      "Developer Comments": "",
      "Due Date": "",
      "Created At": "...",
      "Updated At": "..."
    }
  ]
}
```

### POST — Assign Lead to Developer

```json
Request: {
  "action": "assignLead",
  "name": "...",
  "website": "...",
  "assignedTo": "dev-uid",
  "pipelineStage": "Contacted",
  "priority": "High",
  "dueDate": "2026-07-15",
  "managerNotes": "..."
}
Response: { "success": true } or { "success": false, "error": "..." }
```

### POST — Update Pipeline

```json
Request: {
  "action": "updatePipeline",
  "name": "...",
  "website": "...",
  "pipelineStage": "Qualified",
  "priority": "Medium",
  "managerNotes": "..."
}
Response: { "success": true }
```

### POST — List Developers

```json
Request: { "action": "listDevelopers" }
Response: {
  "success": true,
  "developers": [
    { "uid": "dev1", "name": "John", "specialization": "Frontend" }
  ]
}
```

> The developer roster can come from the auth sheet (filter by Role = developer) or a dedicated Developers sheet.

### POST — Get Activity / History

```json
Request: { "action": "getHistory", "name": "...", "website": "..." }
Response: {
  "success": true,
  "history": [
    { "timestamp": "...", "user": "manager-name", "action": "Assigned to dev1", "details": "..." }
  ]
}
```

---

## UI Requirements

- Dark theme (same style as Quali)
- Login screen with role check
- Main view: table of all leads with columns for pipeline stage, assigned to, priority
- Filters: by pipeline stage, by assigned developer, by priority
- Lead detail modal: all fields, comment history, edit pipeline/assign/priority
- Developer roster panel (add/edit/remove developers)
- Pipeline stage kanban or list view (optional)

---

## Quali Data Contract

CRM must handle these edge cases from Quali's data:
- `company_phone` may have +91 stripped (starts with digits only)
- `Lead Status` is empty on push (Qualifier tags locally, not in shared sheet)
- `Comments` may be empty
- `pushed_by` is the qualifier's display name from auth
- Duplicate detection: same `name` + `website` combo should not be created twice
