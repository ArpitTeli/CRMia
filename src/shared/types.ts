// ===== Lead Types =====
export interface Lead {
  query: string;
  name: string;
  website: string;
  company_phone: string;
  email: string;
  pushed_by: string;
  Comments: string;
  "Lead Status": string;
  "Assigned To": string;
  "Pipeline Stage": string;
  Priority: string;
  "Manager Notes": string;
  "Task Status": string;
  "Developer Comments": string;
  "Due Date": string;
  "Created At": string;
  "Updated At": string;
}

// ===== Developer Types =====
export interface Developer {
  uid: string;
  name: string;
  specialization: string;
  email: string;
  isActive: boolean;
}

// ===== History Types =====
export interface HistoryEntry {
  timestamp: string;
  userUid: string;
  userName: string;
  actionType:
    | "assign"
    | "reassign"
    | "unassign"
    | "stage_change"
    | "priority_change"
    | "notes_edit"
    | "due_date_change";
  leadName: string;
  leadWebsite: string;
  oldValue: string;
  newValue: string;
  notes: string;
}

// ===== Auth Types =====
export interface AuthUser {
  uid: string;
  displayName: string;
  role: string;
}

// ===== API Response Types =====
export interface ApiResponse<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

export interface LoginResponse {
  success: boolean;
  displayName?: string;
  role?: string;
  error?: string;
}

export interface LeadsResponse {
  success: boolean;
  leads: Lead[];
  error?: string;
}

export interface DevelopersResponse {
  success: boolean;
  developers: Developer[];
  error?: string;
}

export interface HistoryResponse {
  success: boolean;
  history: HistoryEntry[];
  error?: string;
}

// ===== API Request Types =====
export interface LoginRequest {
  action: "login";
  uid: string;
  password: string;
}

export interface AssignLeadRequest {
  action: "assignLead";
  name: string;
  website: string;
  assignedTo: string;
  pipelineStage: string;
  priority: string;
  dueDate: string;
  managerNotes: string;
}

export interface UpdatePipelineRequest {
  action: "updatePipeline";
  name: string;
  website: string;
  pipelineStage: string;
  priority: string;
  managerNotes: string;
}

export interface AddDeveloperRequest {
  action: "addDeveloper";
  uid: string;
  name: string;
  specialization: string;
  email: string;
}

export interface UpdateDeveloperRequest {
  action: "updateDeveloper";
  uid: string;
  name?: string;
  specialization?: string;
  email?: string;
  isActive?: boolean;
}

export interface RemoveDeveloperRequest {
  action: "removeDeveloper";
  uid: string;
}

export interface GetHistoryRequest {
  action: "getHistory";
  leadName: string;
  leadWebsite: string;
}

export interface LogHistoryRequest {
  action: "logHistory";
  timestamp: string;
  userUid: string;
  userName: string;
  actionType: string;
  leadName: string;
  leadWebsite: string;
  oldValue: string;
  newValue: string;
  notes: string;
}

// ===== Pipeline =====
export const PIPELINE_STAGES = ["New", "Contacted", "Qualified", "Closed"] as const;
export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export const PRIORITY_LEVELS = ["High", "Medium", "Low"] as const;
export type PriorityLevel = (typeof PRIORITY_LEVELS)[number];

// ===== IPC Channel Names =====
export const IPC_CHANNELS = {
  AUTH_LOGIN: "auth:login",
  LEADS_LIST: "leads:list",
  LEADS_ASSIGN: "leads:assign",
  LEADS_UPDATE_PIPELINE: "leads:updatePipeline",
  DEVELOPERS_LIST: "developers:list",
  DEVELOPERS_ADD: "developers:add",
  DEVELOPERS_UPDATE: "developers:update",
  DEVELOPERS_REMOVE: "developers:remove",
  HISTORY_GET: "history:get",
  HISTORY_LOG: "history:log",
  SHELL_OPEN_EXTERNAL: "shell:openExternal",
} as const;
