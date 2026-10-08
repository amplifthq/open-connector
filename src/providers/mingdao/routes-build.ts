import type { MingdaoRoute } from "./route-types.ts";
export const mingdaoBuildRoutes: Record<string, MingdaoRoute> = {
  create_app_sections: { method: "POST", path: "/v3/app/sections/batch" },
  create_app_items: { method: "POST", path: "/v3/app/items/batch" },
  create_chatbot: { method: "POST", path: "/v3/app/chatbots" },
  create_worksheet: { method: "POST", path: "/v3/app/worksheets" },
  update_worksheet: { method: "POST", path: "/v3/app/worksheets/{worksheetId}" },
  delete_worksheet: { method: "DELETE", path: "/v3/app/worksheets/{worksheetId}", noBody: true },
  batch_create_custom_actions: {
    method: "POST",
    path: "/v3/app/worksheets/{worksheetId}/custom-actions/batch",
    retainPathFields: ["worksheetId"],
  },
  update_custom_page: { method: "PUT", path: "/v3/app/custom-pages/{pageId}" },
  batch_create_views: { method: "POST", path: "/v3/app/worksheets/{worksheetId}/views/batch" },
  create_chart: { method: "POST", path: "/v3/app/worksheets/{worksheetId}/charts" },
};
