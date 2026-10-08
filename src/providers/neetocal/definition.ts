import type { ProviderDefinition } from "../../core/types.ts";

import { neetocalActions } from "./actions.ts";

export const provider: ProviderDefinition = {
  service: "neetocal",
  displayName: "NeetoCal",
  categories: ["Productivity"],
  authTypes: ["api_key"],
  auth: [
    {
      type: "api_key",
      label: "API Key",
      placeholder: "NEETOCAL_API_KEY",
      description:
        "NeetoCal workspace API key sent with the X-Api-Key header. Create it in Admin panel > API Keys: https://help.neetocal.com/articles/api-keys.",
      extraFields: [
        {
          key: "subdomain",
          label: "Workspace subdomain",
          inputType: "text",
          required: true,
          secret: false,
          placeholder: "your-workspace",
          description: "The workspace name from https://{your-workspace}.neetocal.com. Enter only the subdomain.",
        },
      ],
    },
  ],
  homepageUrl: "https://www.neeto.com/neetocal",
  actions: neetocalActions,
};
