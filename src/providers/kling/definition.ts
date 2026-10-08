import type { ProviderDefinition } from "../../core/types.ts";

import { klingActions } from "./actions.ts";

export const provider: ProviderDefinition = {
  service: "kling",
  displayName: "Kling AI",
  categories: ["AI", "Design & Media"],
  authTypes: ["api_key"],
  auth: [
    {
      type: "api_key",
      label: "API Key",
      placeholder: "your-kling-api-key",
      description:
        "Kling AI API key used as a Bearer token for the official V3 API. Create one at https://klingai.com/dev/api-key.",
    },
  ],
  homepageUrl: "https://klingai.com",
  actions: klingActions,
};
