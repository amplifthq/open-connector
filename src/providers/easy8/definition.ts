import type { ProviderDefinition } from "../../core/types.ts";

import { easy8Actions } from "./actions.ts";

export const provider: ProviderDefinition = {
  service: "easy8",
  displayName: "Easy8",
  categories: ["Productivity"],
  authTypes: ["api_key"],
  auth: [
    {
      type: "api_key",
      label: "API Key",
      placeholder: "Your Easy8 API key",
      description:
        "The API key sent in the X-Redmine-API-Key header. Enable REST API access, then generate or view the key in My Account: https://www.easy8.com/services/api.",
      extraFields: [
        {
          key: "baseUrl",
          label: "Instance URL",
          inputType: "text",
          required: true,
          secret: false,
          placeholder: "https://example.easy8.com",
          description: "The root HTTP or HTTPS URL of your publicly reachable Easy8 instance.",
        },
      ],
    },
  ],
  homepageUrl: "https://www.easy8.com",
  actions: easy8Actions,
};
