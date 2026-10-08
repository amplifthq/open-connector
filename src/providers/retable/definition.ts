import type { ProviderDefinition } from "../../core/types.ts";

import { retableActions } from "./actions.ts";

export const provider: ProviderDefinition = {
  service: "retable",
  displayName: "Retable",
  categories: ["Productivity", "Data"],
  authTypes: ["api_key"],
  auth: [
    {
      type: "api_key",
      label: "API Key",
      placeholder: "RTBL-v1-...",
      description: "Retable API key from Account > API: https://my.retable.io/",
    },
  ],
  homepageUrl: "https://www.retable.io",
  actions: retableActions,
};
