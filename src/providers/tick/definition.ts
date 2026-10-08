import type { ProviderDefinition } from "../../core/types.ts";

import { tickActions } from "./actions.ts";

export const provider: ProviderDefinition = {
  service: "tick",
  displayName: "Tick",
  categories: ["Productivity"],
  authTypes: ["api_key"],
  auth: [
    {
      type: "api_key",
      label: "API Token",
      placeholder: "TICK_API_TOKEN",
      description:
        "Tick API token assigned to your subscription role. Retrieve it through the official roles endpoint: https://github.com/tick/tick-api/blob/master/sections/roles.md",
      extraFields: [
        {
          key: "subscriptionId",
          label: "Subscription ID",
          inputType: "text",
          required: true,
          secret: false,
          placeholder: "123456",
          description: "Numeric Tick subscription ID returned with the API token.",
        },
        {
          key: "email",
          label: "Contact Email",
          inputType: "text",
          required: true,
          secret: false,
          placeholder: "you@example.com",
          description: "Contact email included in the User-Agent header as required by the Tick API.",
        },
      ],
    },
  ],
  homepageUrl: "https://www.tickspot.com",
  actions: tickActions,
};
