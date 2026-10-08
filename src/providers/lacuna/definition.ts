import type { ProviderDefinition } from "../../core/types.ts";

import { lacunaActions } from "./actions.ts";

const service = "lacuna";

export const provider: ProviderDefinition = {
  service,
  displayName: "Lacuna",
  description:
    "Search and navigate Lacuna's machine-learning research map, including papers, research directions, authors, and generated hypotheses.",
  categories: ["AI", "Data"],
  authTypes: ["no_auth"],
  auth: [{ type: "no_auth" }],
  homepageUrl: "https://lacuna.tiptreesystems.com",
  actions: lacunaActions,
};
