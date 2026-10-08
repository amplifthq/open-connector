import type { MingdaoRoute } from "./route-types.ts";

export const mingdaoQueryRoutes: Record<string, MingdaoRoute> = {
  list_record_logs: { method: "GET", path: "/v3/app/worksheets/{worksheetId}/rows/{rowId}/logs" },
  list_record_discussions: {
    method: "GET",
    path: "/v3/app/worksheets/{worksheetId}/rows/{rowId}/discussions",
  },
  get_approval: {
    method: "GET",
    path: "/v3/app/workflow/{worksheetId}/rows/{rowId}/approval/{approvalId}",
  },
  list_approvals: {
    method: "POST",
    path: "/v3/app/workflow/{worksheetId}/rows/{rowId}/approval/list",
  },
  list_roles: { method: "GET", path: "/v3/app/roles" },
  get_role: { method: "GET", path: "/v3/app/roles/{roleId}" },
  list_optionsets: { method: "GET", path: "/v3/app/optionsets" },
  lookup_users: { method: "GET", path: "/v3/users/lookup" },
  lookup_departments: { method: "GET", path: "/v3/departments/lookup" },
  list_regions: { method: "GET", path: "/v3/regions" },
  list_knowledge: { method: "POST", path: "/v3/app/knowledge/list", successCodes: [0] },
  search_knowledge: { method: "POST", path: "/v3/app/knowledge/search", successCodes: [0] },
};
