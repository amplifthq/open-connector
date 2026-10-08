import type { ProviderDefinition } from "../../core/types.ts";

import { orimonActions } from "./actions.ts";
export const provider: ProviderDefinition = {
  service: "orimon",
  displayName: "Orimon",
  homepageUrl: "https://orimon.ai",
  categories: ["AI", "Communication"],
  authTypes: ["api_key"],
  auth: [
    {
      type: "api_key",
      ...{
        label: "Developer API Key",
        placeholder: "ORIMON_API_KEY",
        description:
          "Orimon Developer API key sent with the authorization header. Generate or manage it from Profile in the Orimon dashboard: https://orimon.gitbook.io/docs/developer-api/getting-started-with-apis#how-to-generate-your-developer-api-key",
      },
    },
  ],
  actions: orimonActions,
};
