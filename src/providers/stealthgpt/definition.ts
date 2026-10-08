import type { ProviderDefinition } from "../../core/types.ts";

import { stealthgptActions } from "./actions.ts";

export const provider: ProviderDefinition = {
  service: "stealthgpt",
  displayName: "StealthGPT",
  categories: ["AI", "Productivity"],
  authTypes: ["api_key"],
  auth: [
    {
      type: "api_key",
      label: "API Token",
      placeholder: "YOUR_STEALTHGPT_API_TOKEN",
      description:
        "StealthGPT API token sent with the api-token header. Activate API access, then copy the token from the API Key tab: https://www.stealthgpt.ai/api-dashboard/api-key.",
    },
  ],
  homepageUrl: "https://www.stealthgpt.ai",
  actions: stealthgptActions,
};
