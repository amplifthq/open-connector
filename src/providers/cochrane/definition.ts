import type { ProviderDefinition } from "../../core/types.ts";

import { cochraneActions } from "./actions.ts";
export const provider: ProviderDefinition = {
  service: "cochrane",
  displayName: "Cochrane",
  categories: ["Data", "Productivity"],
  authTypes: ["custom_credential"],
  auth: [
    {
      type: "custom_credential",
      fields: [
        {
          key: "authMethod",
          label: "Authentication Method",
          inputType: "text",
          required: true,
          secret: false,
          placeholder: "basic or bearer",
        },
        { key: "username", label: "Username", inputType: "text", required: false, secret: false },
        { key: "password", label: "Password", inputType: "password", required: false, secret: true },
        { key: "bearerToken", label: "Bearer Token", inputType: "password", required: false, secret: true },
      ],
    },
  ],
  homepageUrl: "https://www.cochrane.org",
  actions: cochraneActions,
};
