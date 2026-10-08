import type { ProviderDefinition } from "../../core/types.ts";

import { tikhubActions } from "./actions.ts";

export const provider: ProviderDefinition = {
  service: "tikhub",
  displayName: "TikHub",
  categories: ["Data", "Social"],
  authTypes: ["api_key"],
  auth: [
    {
      type: "api_key",
      label: "API Token",
      placeholder: "tikhub_api_token",
      description:
        "TikHub API token sent with the Authorization: Bearer header. Create it in the TikHub API key dashboard. Grant /api/v1/tikhub/user/ for validation and User actions. For invoke_endpoint, grant the requiredScope values returned by discover_endpoints for the functional endpoints you intend to call.",
    },
  ],
  homepageUrl: "https://tikhub.io/",
  actions: tikhubActions,
};
