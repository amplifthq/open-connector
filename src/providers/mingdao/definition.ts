import type { ProviderDefinition } from "../../core/types.ts";

import { mingdaoActions } from "./actions.ts";

export const provider: ProviderDefinition = {
  service: "mingdao",
  displayName: "Mingdao",
  description:
    "Query and manage Mingdao application worksheets, records, workflows, roles, knowledge, and application structure.",
  categories: ["Productivity", "Data"],
  authTypes: ["api_key"],
  auth: [
    {
      type: "api_key",
      label: "AppKey",
      placeholder: "MINGDAO_APP_KEY",
      description:
        "Application key created by an application administrator under API documentation > Authorization management. See https://help.mingdao.com/api/introduction/.",
      extraFields: [
        {
          key: "sign",
          label: "Sign",
          inputType: "password",
          required: true,
          secret: true,
          placeholder: "MINGDAO_SIGN",
          description:
            "Secret Sign paired with the AppKey, copied from the application's API documentation > Authorization management.",
        },
      ],
    },
  ],
  homepageUrl: "https://www.mingdao.com/",
  actions: mingdaoActions,
};
