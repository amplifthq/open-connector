import type { ProviderDefinition } from "../../core/types.ts";

import { githubActions } from "./actions.ts";
import { githubOAuthScopes } from "./scopes.ts";

const service = "github";

/**
 * GitHub provider backed by the GitHub REST API.
 *
 * Open-source users can configure a personal access token, bring their own
 * GitHub OAuth app, or connect one installation of a host-configured GitHub
 * App without copying the App private key into each connection.
 */
export const provider: ProviderDefinition = {
  service,
  displayName: "GitHub",
  categories: ["Developer Tools"],
  authTypes: ["oauth2", "custom_credential", "api_key"],
  auth: [
    {
      type: "oauth2",
      authorizationUrl: "https://github.com/login/oauth/authorize",
      tokenUrl: "https://github.com/login/oauth/access_token",
      scopes: githubOAuthScopes,
      tokenEndpointAuthMethod: "client_secret_post",
    },
    {
      type: "custom_credential",
      fields: [
        {
          key: "installationId",
          label: "GitHub App installation ID",
          inputType: "text",
          required: true,
          secret: false,
          placeholder: "12345678",
          description:
            "The GitHub App installation to use. The host must configure OOMOL_CONNECT_GITHUB_APP_ID and OOMOL_CONNECT_GITHUB_APP_PRIVATE_KEY.",
        },
      ],
    },
    {
      type: "api_key",
      label: "Personal access token",
      placeholder: "github_pat_...",
      description:
        "GitHub personal access token used with the Authorization Bearer header. Fine-grained tokens are recommended.",
    },
  ],
  homepageUrl: "https://github.com",
  actions: githubActions,
};
