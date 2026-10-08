import type { ProviderDefinition } from "../../core/types.ts";

import { wire2AirActions } from "./actions.ts";

export const provider: ProviderDefinition = {
  service: "wire2air",
  displayName: "Wire2Air",
  categories: ["Communication"],
  authTypes: ["api_key"],
  auth: [
    {
      type: "api_key",
      label: "API Key",
      placeholder: "WIRE2AIR_API_KEY",
      description:
        "Wire2Air API key sent with the apikey header. Generate one in the Wire2Air dashboard under Manage Account > Manage API Keys at https://mzone.wire2air.com.",
    },
  ],
  homepageUrl: "https://www.wire2air.com",
  actions: wire2AirActions,
};
