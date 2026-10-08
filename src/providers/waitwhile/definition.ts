import type { ProviderDefinition } from "../../core/types.ts";

import { waitwhileActions } from "./actions.ts";

export const provider: ProviderDefinition = {
  service: "waitwhile",
  displayName: "Waitwhile",
  categories: ["Productivity"],
  authTypes: ["api_key"],
  auth: [
    {
      type: "api_key",
      label: "API Key",
      placeholder: "waitwhile_api_key",
      description: "Waitwhile API key from the Waitwhile dashboard: https://waitwhile.com/",
    },
  ],
  homepageUrl: "https://waitwhile.com",
  actions: waitwhileActions,
};
