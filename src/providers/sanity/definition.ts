import type { ProviderDefinition } from "../../core/types.ts";

import { sanityActions } from "./actions.ts";

export const provider: ProviderDefinition = {
  service: "sanity",
  displayName: "Sanity",
  categories: ["Documents", "Data", "Developer Tools"],
  authTypes: ["api_key"],
  auth: [
    {
      type: "api_key",
      label: "API Token",
      placeholder: "sk...",
      description:
        "Sanity robot or personal token sent as a Bearer credential. Create a project token in Settings > API > Tokens: https://www.sanity.io/docs/content-lake/http-auth",
      extraFields: [
        {
          key: "projectId",
          label: "Project ID",
          inputType: "text",
          required: true,
          secret: false,
          placeholder: "your-project-id",
          description:
            "Sanity project identifier used to select the Content Lake API origin. Find it in your project management settings at https://www.sanity.io/manage.",
        },
      ],
    },
  ],
  homepageUrl: "https://www.sanity.io",
  actions: sanityActions,
};
