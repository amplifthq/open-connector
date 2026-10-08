import type { ProviderDefinition } from "../../core/types.ts";

import { zenkitActions } from "./actions.ts";

export const provider: ProviderDefinition = {
  service: "zenkit",
  displayName: "Zenkit",
  categories: ["Productivity"],
  authTypes: ["api_key"],
  auth: [
    {
      type: "api_key",
      label: "API Key",
      placeholder: "xxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      description:
        "Zenkit API key sent in the Zenkit-API-Key header. Generate or copy it from your Zenkit profile: https://base.zenkit.com/docs/api/overview/authentication.",
    },
  ],
  homepageUrl: "https://zenkit.com/",
  actions: zenkitActions,
};
