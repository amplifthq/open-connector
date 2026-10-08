import type { ProviderDefinition } from "../../core/types.ts";

import { harpaAiActions } from "./actions.ts";

export const provider: ProviderDefinition = {
  service: "harpa_ai",
  displayName: "HARPA AI",
  categories: ["AI", "Productivity"],
  authTypes: ["api_key"],
  auth: [
    {
      type: "api_key",
      label: "API Key",
      placeholder: "HARPA_API_KEY",
      description: "HARPA GRID API key from your HARPA AI account: https://harpa.ai/",
    },
  ],
  homepageUrl: "https://harpa.ai/",
  actions: harpaAiActions,
};
