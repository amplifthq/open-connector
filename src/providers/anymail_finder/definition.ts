import type { ProviderDefinition } from "../../core/types.ts";

import { anymailFinderActions } from "./actions.ts";

export const provider: ProviderDefinition = {
  service: "anymail_finder",
  displayName: "Anymail Finder",
  categories: ["Marketing", "Data"],
  authTypes: ["api_key"],
  auth: [
    {
      type: "api_key",
      label: "API Key",
      placeholder: "ANYMAIL_FINDER_API_KEY",
      description:
        "Anymail Finder API key sent in the Authorization header. Create or copy it at https://app.anymailfinder.com/settings/api.",
    },
  ],
  homepageUrl: "https://anymailfinder.com",
  actions: anymailFinderActions,
};
