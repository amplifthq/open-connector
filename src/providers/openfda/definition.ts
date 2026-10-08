import type { ProviderDefinition } from "../../core/types.ts";

import { openfdaActions } from "./actions.ts";

const service = "openfda";

export const provider: ProviderDefinition = {
  service,
  displayName: "openFDA",
  categories: ["Data"],
  authTypes: ["no_auth", "api_key"],
  auth: [
    { type: "no_auth" },
    {
      type: "api_key",
      label: "openFDA API Key",
      placeholder: "OPENFDA_API_KEY",
      description: "Optional API key from https://open.fda.gov/apis/authentication/",
    },
  ],
  homepageUrl: "https://open.fda.gov/",
  actions: openfdaActions,
};
