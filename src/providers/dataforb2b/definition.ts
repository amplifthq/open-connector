import type { ProviderDefinition } from "../../core/types.ts";

import { dataForB2BActions } from "./actions.ts";

export const provider: ProviderDefinition = {
  service: "dataforb2b",
  displayName: "DataForB2B",
  categories: ["Data", "Marketing"],
  authTypes: ["api_key"],
  auth: [
    {
      type: "api_key",
      label: "API Key",
      placeholder: "DATAFORB2B_API_KEY",
      description:
        "DataForB2B API key sent with the api_key header. Generate it under Settings > API Keys after signing in at https://app.dataforb2b.ai.",
    },
  ],
  homepageUrl: "https://dataforb2b.ai",
  actions: dataForB2BActions,
};
