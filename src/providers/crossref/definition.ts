import type { ProviderDefinition } from "../../core/types.ts";

import { crossrefActions } from "./actions.ts";
export const provider: ProviderDefinition = {
  service: "crossref",
  displayName: "Crossref",
  categories: ["Data"],
  authTypes: ["no_auth", "api_key"],
  auth: [
    { type: "no_auth" },
    {
      type: "api_key",
      label: "Metadata Plus API Key",
      placeholder: "CROSSREF_PLUS_API_KEY",
      description: "Optional Metadata Plus API key from https://manage.crossref.org/keys",
    },
  ],
  homepageUrl: "https://www.crossref.org/",
  actions: crossrefActions,
};
