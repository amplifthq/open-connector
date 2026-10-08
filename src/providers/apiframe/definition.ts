import type { ProviderDefinition } from "../../core/types.ts";

import { apiframeActions } from "./actions.ts";

export const provider: ProviderDefinition = {
  service: "apiframe",
  displayName: "Apiframe",
  categories: ["AI", "Design & Media"],
  authTypes: ["api_key"],
  auth: [
    {
      type: "api_key",
      label: "API Key",
      placeholder: "afk_...",
      description:
        "Apiframe API key sent in the X-API-Key header. Create and manage keys in the official dashboard: https://console.apiframe.ai/.",
    },
  ],
  homepageUrl: "https://apiframe.ai/",
  actions: apiframeActions,
};
