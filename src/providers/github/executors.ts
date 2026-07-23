import type { CredentialValidators, ProviderExecutors } from "../../core/types.ts";
import type { GitHubActionContext } from "./runtime-shared.ts";

import { defineProviderExecutors, requireBearerCredential } from "../provider-runtime.ts";
import { resolveGitHubAppInstallation } from "./app-auth.ts";
import { activityActionHandlers } from "./runtime-activity.ts";
import { issueActionHandlers } from "./runtime-issue.ts";
import { pullRequestActionHandlers } from "./runtime-pull-request.ts";
import { releaseActionHandlers } from "./runtime-release.ts";
import { repositoryActionHandlers } from "./runtime-repository.ts";
import { searchActionHandlers } from "./runtime-search.ts";
import { githubRequestJson } from "./runtime-shared.ts";

const service = "github";

export const executors: ProviderExecutors = defineProviderExecutors<GitHubActionContext>({
  service,
  handlers: Object.assign(
    {},
    activityActionHandlers,
    repositoryActionHandlers,
    issueActionHandlers,
    pullRequestActionHandlers,
    releaseActionHandlers,
    searchActionHandlers,
  ),
  async createContext(context, fetcher): Promise<GitHubActionContext> {
    const configuredCredential = await context.getCredential(service);
    if (configuredCredential?.authType === "custom_credential") {
      const installation = await resolveGitHubAppInstallation({
        fetcher,
        installationId: configuredCredential.values.installationId ?? "",
        runtimeConfig: context.runtimeConfig,
      });
      return {
        accessToken: installation.accessToken,
        fetcher,
      };
    }
    const credential = await requireBearerCredential(context, service);
    return {
      accessToken: credential.accessToken,
      fetcher,
    };
  },
});

export const credentialValidators: CredentialValidators = {
  async apiKey(input, { fetcher }) {
    return validateGitHubToken(input.apiKey, fetcher);
  },
  async oauth2(input, { fetcher }) {
    return validateGitHubToken(input.accessToken, fetcher);
  },
  async customCredential(input, { fetcher, runtimeConfig }) {
    const installation = await resolveGitHubAppInstallation({
      fetcher,
      installationId: input.values.installationId ?? "",
      runtimeConfig,
    });
    return {
      grantedScopes: Object.entries(installation.installation.permissions).map(
        ([name, permission]) => `${name}:${permission}`,
      ),
      metadata: {
        expiresAt: installation.expiresAt,
        installation: installation.installation,
      },
      profile: {
        accountId: `${installation.installation.accountType.toLowerCase()}:${installation.installation.accountId}`,
        displayName: `${installation.installation.accountLogin} (GitHub App)`,
      },
    };
  },
};

async function validateGitHubToken(accessToken: string, fetcher: typeof fetch) {
  const user = await githubRequestJson<Record<string, unknown>>({
    path: "/user",
    accessToken,
    fetcher,
  });

  const login = typeof user.login === "string" ? user.login : undefined;
  const id = user.id === undefined ? undefined : String(user.id);
  const name = typeof user.name === "string" && user.name.trim() ? user.name.trim() : undefined;

  return {
    profile: {
      accountId: login ?? id ?? "github:user",
      displayName: name ?? login ?? id ?? "GitHub User",
    },
    metadata: {
      currentUser: user,
    },
  };
}
