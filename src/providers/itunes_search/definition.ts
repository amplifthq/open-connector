import type { ProviderDefinition } from "../../core/types.ts";

import { itunesSearchActions } from "./actions.ts";

export const provider: ProviderDefinition = {
  service: "itunes_search",
  displayName: "iTunes Search API",
  description: "Search public iTunes Store, App Store, Apple Books, Music, and Podcast records.",
  categories: ["Data", "Media"],
  authTypes: ["no_auth"],
  auth: [{ type: "no_auth" }],
  homepageUrl: "https://performance-partners.apple.com/search-api",
  actions: itunesSearchActions,
};
