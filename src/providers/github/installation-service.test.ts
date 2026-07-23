import type { ResolvedCredential } from "../../core/types.ts";

import { describe, expect, it, vi } from "vitest";
import { GitHubAppInstallationService } from "./installation-service.ts";

describe("GitHubAppInstallationService", () => {
  it("verifies user access, removes the temporary OAuth credential, and stores only the installation id", async () => {
    const calls: string[] = [];
    const oauthCredential: Extract<ResolvedCredential, { authType: "oauth2" }> = {
      accessToken: "ghu_user_token",
      authType: "oauth2",
      metadata: {},
      profile: {
        accountId: "felix",
        displayName: "Felix",
        grantedScopes: [],
      },
      tokenType: "Bearer",
    };
    const connections = {
      connectWithCustomCredential: vi.fn(async (_service, input) => {
        calls.push(`connect:${input.connectionName}`);
        return {
          authType: "custom_credential" as const,
          configured: true as const,
          connectionName: input.connectionName,
          default: false,
          id: "connection-1",
          profile: {
            accountId: "organization:42",
            displayName: "amplifthq (GitHub App)",
            grantedScopes: [],
          },
          service: "github",
          virtual: false,
        };
      }),
      disconnect: vi.fn(async (_service, connectionName) => {
        calls.push(`disconnect:${connectionName}`);
        return {
          configured: false as const,
          connectionName,
          service: "github",
        };
      }),
      getCredential: vi.fn(async () => oauthCredential),
    };
    const verifyUserInstallation = vi.fn(async () => ({
      accountId: "42",
      accountLogin: "amplifthq",
      accountType: "Organization" as const,
      installationId: "987",
      permissions: { metadata: "read" },
      repositorySelection: "selected" as const,
    }));
    const service = new GitHubAppInstallationService({
      connections,
      runtimeConfig: githubAppRuntimeConfig,
      verifyUserInstallation,
    });

    await expect(
      service.complete({
        installationId: "987",
        targetConnectionName: "organization:org-1:github",
        verificationConnectionName: "github-install-verifier:state-1",
      }),
    ).resolves.toMatchObject({
      configured: true,
      connectionName: "organization:org-1:github",
    });
    expect(verifyUserInstallation).toHaveBeenCalledWith(
      expect.objectContaining({
        accessToken: "ghu_user_token",
        installationId: "987",
      }),
    );
    expect(calls).toEqual(["disconnect:github-install-verifier:state-1", "connect:organization:org-1:github"]);
    expect(connections.connectWithCustomCredential).toHaveBeenCalledWith("github", {
      connectionName: "organization:org-1:github",
      values: { installationId: "987" },
    });
  });

  it("fails before changing connections when the verifier is not a GitHub user token", async () => {
    const connections = {
      connectWithCustomCredential: vi.fn(),
      disconnect: vi.fn(),
      getCredential: vi.fn(async () => ({
        apiKey: "github_pat",
        authType: "api_key" as const,
        metadata: {},
        profile: {
          accountId: "felix",
          displayName: "Felix",
          grantedScopes: [],
        },
        values: { apiKey: "github_pat" },
      })),
    };
    const service = new GitHubAppInstallationService({
      connections,
      runtimeConfig: githubAppRuntimeConfig,
      verifyUserInstallation: vi.fn(),
    });

    await expect(
      service.complete({
        installationId: "987",
        targetConnectionName: "organization:org-1:github",
        verificationConnectionName: "github-install-verifier:state-1",
      }),
    ).rejects.toThrow("GitHub App installation verification requires a GitHub user access token");
    expect(connections.disconnect).not.toHaveBeenCalled();
    expect(connections.connectWithCustomCredential).not.toHaveBeenCalled();
  });

  it("rejects a target that would overwrite the temporary verifier connection", async () => {
    const connections = {
      connectWithCustomCredential: vi.fn(),
      disconnect: vi.fn(),
      getCredential: vi.fn(),
    };
    const service = new GitHubAppInstallationService({
      connections,
      runtimeConfig: githubAppRuntimeConfig,
      verifyUserInstallation: vi.fn(),
    });

    await expect(
      service.complete({
        installationId: "987",
        targetConnectionName: "same",
        verificationConnectionName: "same",
      }),
    ).rejects.toThrow("The target GitHub connection must differ from the verification connection");
  });
});

function githubAppRuntimeConfig(name: string): string | undefined {
  if (name === "OOMOL_CONNECT_GITHUB_APP_ID") {
    return "12345";
  }
  if (name === "OOMOL_CONNECT_GITHUB_APP_PRIVATE_KEY") {
    return "private-key";
  }
  return undefined;
}
