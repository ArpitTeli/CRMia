"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPC_CHANNELS = exports.PRIORITY_LEVELS = exports.PIPELINE_STAGES = void 0;
// ===== Pipeline =====
exports.PIPELINE_STAGES = ["New", "Contacted", "Qualified", "Closed"];
exports.PRIORITY_LEVELS = ["High", "Medium", "Low"];
// ===== IPC Channel Names =====
exports.IPC_CHANNELS = {
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
};
//# sourceMappingURL=types.js.map