import type { ProviderDefinition } from "../../core/types.ts";

import { dataciteActions } from "./actions.ts";
export const provider: ProviderDefinition = {
  service: "datacite",
  displayName: "DataCite",
  categories: ["Data"],
  authTypes: ["no_auth", "api_key"],
  auth: [
    { type: "no_auth" },
    {
      type: "api_key",
      label: "Repository API Key",
      placeholder: "DC.xxxxxxxxxx_API_KEY",
      description:
        "Optional for public DOI metadata and required for authorized records. See https://support.datacite.org/docs/api-keys",
    },
  ],
  homepageUrl: "https://datacite.org/",
  actions: dataciteActions,
};
