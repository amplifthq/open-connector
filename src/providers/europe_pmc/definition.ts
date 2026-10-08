import type { ProviderDefinition } from "../../core/types.ts";

import { europePmcActions } from "./actions.ts";
export const provider: ProviderDefinition = {
  service: "europe_pmc",
  displayName: "Europe PMC",
  categories: ["Data"],
  authTypes: ["no_auth"],
  auth: [{ type: "no_auth" }],
  homepageUrl: "https://europepmc.org/",
  actions: europePmcActions,
};
