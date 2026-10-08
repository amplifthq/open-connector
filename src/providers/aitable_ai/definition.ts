import type { ProviderDefinition } from "../../core/types.ts";

import { aitableAiActions } from "./actions.ts";

export const provider: ProviderDefinition = {
  service: "aitable_ai",
  displayName: "AITable",
  categories: ["Productivity", "Data"],
  authTypes: ["api_key"],
  auth: [
    {
      type: "api_key",
      label: "API Token",
      placeholder: "YOUR_API_TOKEN",
      description:
        "AITable API Token sent as a Bearer credential. Generate it in User Center > Developer Configuration: https://developers.aitable.ai/api/quick-start/",
      extraFields: [],
    },
  ],
  homepageUrl: "https://aitable.ai",
  actions: aitableAiActions,
};
