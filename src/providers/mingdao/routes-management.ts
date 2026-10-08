import type { MingdaoRoute } from "./route-types.ts";

export const mingdaoManagementRoutes: Record<string, MingdaoRoute> = {
  create_role: { method: "POST", path: "/v3/app/roles" },
  delete_role: { method: "DELETE", path: "/v3/app/roles/{roleId}", noBody: true },
  add_role_members: { method: "POST", path: "/v3/app/roles/{roleId}/members" },
  remove_role_members: { method: "DELETE", path: "/v3/app/roles/{roleId}/members" },
  remove_user_from_all_roles: {
    method: "DELETE",
    path: "/v3/app/roles/users/{userId}",
    noBody: true,
  },
  create_optionset: { method: "POST", path: "/v3/app/optionsets" },
  update_optionset: { method: "PUT", path: "/v3/app/optionsets/{optionsetId}" },
  disable_optionset: { method: "DELETE", path: "/v3/app/optionsets/{optionsetId}", noBody: true },
  generate_record_share_link: {
    method: "POST",
    path: "/v3/app/worksheets/{worksheetId}/rows/{rowId}/share-link",
  },
};
