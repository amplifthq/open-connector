import type { ProviderDefinition } from "../../core/types.ts";

import { orcidActions, orcidProviderScopes } from "./actions.ts";
export const provider: ProviderDefinition = {
  service: "orcid",
  displayName: "ORCID",
  categories: ["Data"],
  authTypes: ["oauth2"],
  auth: [
    {
      type: "oauth2",
      authorizationUrl: "https://orcid.org/oauth/authorize",
      tokenUrl: "https://orcid.org/oauth/token",
      scopes: [orcidProviderScopes.openid],
      tokenEndpointAuthMethod: "client_secret_post",
    },
  ],
  homepageUrl: "https://orcid.org/",
  actions: orcidActions,
};
