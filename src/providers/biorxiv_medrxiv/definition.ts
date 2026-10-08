import type { ProviderDefinition } from "../../core/types.ts";

import { biorxivMedrxivActions } from "./actions.ts";

const service = "biorxiv_medrxiv";

export const provider: ProviderDefinition = {
  service,
  displayName: "bioRxiv and medRxiv",
  categories: ["Data"],
  authTypes: ["no_auth"],
  auth: [{ type: "no_auth" }],
  homepageUrl: "https://www.biorxiv.org/",
  actions: biorxivMedrxivActions,
};
