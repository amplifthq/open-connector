import type { ProviderDefinition } from "../../core/types.ts";

import { instagramActions, instagramOAuthScopes } from "./actions.ts";

const service = "instagram";

/** Instagram API provider using an operator-owned Meta Business application. */
export const provider: ProviderDefinition = {
  service,
  displayName: "Instagram",
  categories: ["Social", "Marketing"],
  authTypes: ["oauth2"],
  auth: [
    {
      type: "oauth2",
      authorizationUrl: "https://www.instagram.com/oauth/authorize",
      tokenUrl: "https://api.instagram.com/oauth/access_token",
      scopes: instagramOAuthScopes,
      scopeSeparator: ",",
      tokenEndpointAuthMethod: "client_secret_post",
      authorizationParams: {
        enable_fb_login: "0",
        force_authentication: "1",
      },
      clientSetup: {
        docsUrl:
          "https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/business-login",
        steps: [
          "Create a Meta Business app, add the Instagram product, and configure Business Login for Instagram.",
          "Register this runtime's exact /oauth/callback URL as a valid OAuth redirect URI.",
          "Copy the Instagram App ID and App Secret into the local OAuth client configuration.",
        ],
      },
    },
  ],
  homepageUrl: "https://www.instagram.com/",
  actions: instagramActions,
};
