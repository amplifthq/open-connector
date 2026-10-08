import type { ProviderDefinition } from "../../core/types.ts";

import { predictleadsActions } from "./actions.ts";

export const provider: ProviderDefinition = {
  service: "predictleads",
  displayName: "PredictLeads",
  categories: ["Data", "Marketing"],
  authTypes: ["api_key"],
  auth: [
    {
      type: "api_key",
      label: "API Key",
      placeholder: "PREDICTLEADS_API_KEY",
      description:
        "PredictLeads API key sent in the X-Api-Key header. Copy it from your subscription page: https://predictleads.com/subscriptions",
      extraFields: [
        {
          key: "apiToken",
          label: "API Token",
          inputType: "password",
          required: true,
          secret: true,
          placeholder: "PREDICTLEADS_API_TOKEN",
          description:
            "PredictLeads API token paired with your API key and sent in the X-Api-Token header. Copy it from your subscription page: https://predictleads.com/subscriptions",
        },
      ],
    },
  ],
  homepageUrl: "https://predictleads.com",
  actions: predictleadsActions,
};
