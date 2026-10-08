import type { ProviderDefinition } from "../../core/types.ts";

import { bloomerangActions } from "./actions.ts";

export const provider: ProviderDefinition = {
  service: "bloomerang",
  displayName: "Bloomerang",
  categories: ["Productivity"],
  authTypes: ["api_key"],
  auth: [
    {
      type: "api_key",
      label: "Private API Key",
      placeholder: "BLOOMERANG_API_KEY",
      description:
        "Bloomerang CRM private API key sent in the X-API-KEY header. Generate it from Profile > My Profile > API Keys 2.0: https://help.bloomerang.com/en/articles/12632849-generate-and-deactivate-private-api-keys.",
    },
  ],
  homepageUrl: "https://bloomerang.com/",
  actions: bloomerangActions,
};
