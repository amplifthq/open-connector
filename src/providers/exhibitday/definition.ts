import type { ProviderDefinition } from "../../core/types.ts";

import { exhibitdayActions } from "./actions.ts";

export const provider: ProviderDefinition = {
  service: "exhibitday",
  displayName: "ExhibitDay",
  categories: ["Productivity"],
  authTypes: ["api_key"],
  auth: [
    {
      type: "api_key",
      label: "API Key",
      placeholder: "YOUR_API_KEY",
      description:
        "ExhibitDay workspace API key. Copy it from Workspace Settings > API & Integrations > API Access: https://api.exhibitday.com/",
    },
  ],
  homepageUrl: "https://www.exhibitday.com",
  actions: exhibitdayActions,
};
