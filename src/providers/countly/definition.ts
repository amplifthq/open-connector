import type { ProviderDefinition } from "../../core/types.ts";

import { countlyActions } from "./actions.ts";

export const provider: ProviderDefinition = {
  service: "countly",
  displayName: "Countly",
  categories: ["Data & Analytics"],
  authTypes: ["api_key"],
  auth: [
    {
      type: "api_key",
      label: "API Key",
      placeholder: "your-countly-api-key",
      description:
        "Countly account API key sent as the api_key query parameter. Find it in your Countly account Management menu: https://support.countly.com/hc/en-us/articles/360037092072-Server-API-Reference.",
      extraFields: [
        {
          key: "baseUrl",
          label: "Countly Base URL",
          inputType: "text",
          required: true,
          secret: false,
          placeholder: "https://analytics.example.com",
          description: "The root URL of your Countly Flex, private cloud, or self-hosted instance without a path.",
        },
      ],
    },
  ],
  homepageUrl: "https://countly.com/",
  actions: countlyActions,
};
