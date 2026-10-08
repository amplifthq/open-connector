import type { ProviderDefinition } from "../../core/types.ts";

import { unpaywallActions } from "./actions.ts";
export const provider: ProviderDefinition = {
  service: "unpaywall",
  displayName: "Unpaywall",
  categories: ["Data"],
  authTypes: ["custom_credential"],
  auth: [
    {
      type: "custom_credential",
      fields: [
        {
          key: "email",
          label: "Email",
          inputType: "text",
          required: true,
          secret: false,
          placeholder: "researcher@example.com",
          description: "Contact email required by the Unpaywall API. See https://unpaywall.org/products/api.",
        },
      ],
    },
  ],
  homepageUrl: "https://unpaywall.org/",
  actions: unpaywallActions,
};
