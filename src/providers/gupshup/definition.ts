import type { ProviderDefinition } from "../../core/types.ts";

import { gupshupActions } from "./actions.ts";

export const provider: ProviderDefinition = {
  service: "gupshup",
  displayName: "Gupshup",
  categories: ["Communication", "Marketing"],
  authTypes: ["api_key"],
  auth: [
    {
      type: "api_key",
      label: "API Key",
      placeholder: "GUPSHUP_API_KEY",
      description:
        "Gupshup API key sent in the apikey header. Open the target app in https://www.gupshup.io/whatsapp/dashboard and copy the key from App Settings.",
      extraFields: [
        {
          key: "appId",
          label: "App ID",
          inputType: "text",
          required: true,
          secret: false,
          placeholder: "YOUR_GUPSHUP_APP_ID",
          description:
            "Gupshup WhatsApp app ID used for app-scoped template requests. Find it beside the API key in the target app's Settings page at https://www.gupshup.io/whatsapp/dashboard.",
        },
      ],
    },
  ],
  homepageUrl: "https://www.gupshup.io",
  actions: gupshupActions,
};
