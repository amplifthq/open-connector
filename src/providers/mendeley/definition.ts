import type { ProviderDefinition } from "../../core/types.ts";

import { mendeleyActions, mendeleyProviderScopes } from "./actions.ts";
export const provider: ProviderDefinition = {
  service: "mendeley",
  displayName: "Mendeley",
  categories: ["Productivity", "Data"],
  authTypes: ["oauth2"],
  auth: [
    {
      type: "oauth2",
      authorizationUrl: "https://api.mendeley.com/oauth/authorize",
      tokenUrl: "https://api.mendeley.com/oauth/token",
      scopes: [mendeleyProviderScopes.all],
      tokenEndpointAuthMethod: "client_secret_basic",
    },
  ],
  homepageUrl: "https://www.mendeley.com/",
  actions: mendeleyActions,
};
