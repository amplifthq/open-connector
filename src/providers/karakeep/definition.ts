import type { ProviderDefinition } from "../../core/types.ts";

import { karakeepActions } from "./actions.ts";

export const provider: ProviderDefinition = {
  service: "karakeep",
  displayName: "Karakeep",
  description:
    "Manage bookmarks, lists, tags, highlights, assets, backups, feeds, users, and administrative jobs on Karakeep.",
  categories: ["Productivity", "Documents"],
  authTypes: ["api_key"],
  auth: [
    {
      type: "api_key",
      label: "API Key",
      placeholder: "ak2_...",
      description:
        "A Karakeep API key sent as a Bearer token. Create one under Settings > API Keys on your Karakeep instance and select the fullaccess scope so credential validation and every listed action can run. Scoped keys are not currently supported by this connection. See https://docs.karakeep.app/api/karakeep-api/.",
      extraFields: [
        {
          key: "instanceUrl",
          label: "Instance URL",
          inputType: "text",
          required: false,
          secret: false,
          placeholder: "https://cloud.karakeep.app",
          description:
            "The root URL of your Karakeep instance. Leave blank for https://cloud.karakeep.app. Private-network instances require OOMOL_CONNECT_ALLOW_PRIVATE_NETWORK; loopback, reserved, and cloud-metadata targets always remain blocked.",
        },
      ],
    },
  ],
  homepageUrl: "https://karakeep.app",
  actions: karakeepActions,
};
