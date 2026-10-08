import type { ProviderDefinition } from "../../core/types.ts";

import { cuboxActions } from "./actions.ts";

const service = "cubox";

export const provider: ProviderDefinition = {
  service,
  displayName: "Cubox",
  description: "Save web pages to Cubox for later reading and processing.",
  categories: ["Productivity"],
  authTypes: ["custom_credential"],
  auth: [
    {
      type: "custom_credential",
      fields: [
        {
          key: "apiUrl",
          label: "API URL",
          inputType: "password",
          required: true,
          secret: true,
          placeholder: "https://cubox.pro/...",
          description:
            "The personal API URL copied from Cubox under Preferences > Extensions and Automation > API Extension. Keep this URL secret: https://help.cubox.pro/save/89d3/.",
        },
      ],
    },
  ],
  homepageUrl: "https://cubox.pro",
  actions: cuboxActions,
};
