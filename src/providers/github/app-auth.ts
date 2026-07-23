import type { RuntimeConfigReader } from "../../core/types.ts";

import { importPKCS8, SignJWT } from "jose";
import { requiredString } from "../../core/cast.ts";
import { ProviderRequestError } from "../provider-runtime.ts";
import { githubApiBaseUrl, githubHeaders, normalizeGitHubError, readJsonResponse } from "./runtime-shared.ts";

export const githubAppIdConfigName = "OOMOL_CONNECT_GITHUB_APP_ID";
export const githubAppPrivateKeyConfigName = "OOMOL_CONNECT_GITHUB_APP_PRIVATE_KEY";

const GITHUB_APP_JWT_LIFETIME_SECONDS = 9 * 60;
const GITHUB_APP_JWT_CLOCK_SKEW_SECONDS = 60;
const MAX_USER_INSTALLATION_PAGES = 10;

type GitHubAppInstallationPayload = {
  account?: {
    id?: number | string;
    login?: string;
    type?: string;
  };
  app_id?: number | string;
  id?: number | string;
  permissions?: Record<string, unknown>;
  repository_selection?: string;
  suspended_at?: string | null;
};

type GitHubAppInstallationTokenPayload = {
  expires_at?: string;
  permissions?: Record<string, unknown>;
  repository_selection?: string;
  token?: string;
};

export type GitHubAppInstallation = {
  accountId: string;
  accountLogin: string;
  accountType: "Organization" | "User";
  installationId: string;
  permissions: Record<string, string>;
  repositorySelection: "all" | "selected";
};

export type ResolvedGitHubAppInstallation = {
  accessToken: string;
  expiresAt: string;
  installation: GitHubAppInstallation;
};

export async function createGitHubAppJwt(input: {
  appId: string;
  nowMs?: number;
  privateKeyPem: string;
}): Promise<string> {
  const appId = requirePositiveIntegerText(input.appId, "GitHub App id");
  const privateKeyPem = normalizePrivateKey(input.privateKeyPem);
  let privateKey: CryptoKey;
  try {
    privateKey = await importPKCS8(privateKeyPem, "RS256");
  } catch {
    throw new ProviderRequestError(
      503,
      `${githubAppPrivateKeyConfigName} must be an unencrypted PKCS8 RSA private key in PEM format.`,
    );
  }
  const nowSeconds = Math.floor((input.nowMs ?? Date.now()) / 1000);
  return await new SignJWT({})
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuedAt(nowSeconds - GITHUB_APP_JWT_CLOCK_SKEW_SECONDS)
    .setExpirationTime(nowSeconds + GITHUB_APP_JWT_LIFETIME_SECONDS)
    .setIssuer(appId)
    .sign(privateKey);
}

export async function resolveGitHubAppInstallation(input: {
  fetcher: typeof fetch;
  installationId: string;
  runtimeConfig?: RuntimeConfigReader;
}): Promise<ResolvedGitHubAppInstallation> {
  const configuration = readGitHubAppRuntimeConfiguration(input.runtimeConfig);
  const installationId = requirePositiveIntegerText(input.installationId, "GitHub App installation id");
  const appJwt = await createGitHubAppJwt(configuration);
  const installation = await getGitHubAppInstallation({
    appId: configuration.appId,
    appJwt,
    fetcher: input.fetcher,
    installationId,
  });
  const tokenPayload = await requestGitHubJson<GitHubAppInstallationTokenPayload>({
    accessToken: appJwt,
    body: {},
    fetcher: input.fetcher,
    method: "POST",
    path: `/app/installations/${encodeURIComponent(installationId)}/access_tokens`,
  });
  const accessToken = requiredString(tokenPayload.token, "GitHub App installation token", providerResponseError);
  const expiresAt = requiredString(
    tokenPayload.expires_at,
    "GitHub App installation token expiration",
    providerResponseError,
  );
  return {
    accessToken,
    expiresAt,
    installation: {
      ...installation,
      permissions: normalizePermissions(tokenPayload.permissions ?? installation.permissions),
      repositorySelection: normalizeRepositorySelection(
        tokenPayload.repository_selection ?? installation.repositorySelection,
      ),
    },
  };
}

export async function verifyGitHubUserInstallation(input: {
  accessToken: string;
  fetcher: typeof fetch;
  installationId: string;
  runtimeConfig?: RuntimeConfigReader;
}): Promise<GitHubAppInstallation> {
  const configuration = readGitHubAppRuntimeConfiguration(input.runtimeConfig);
  const installationId = requirePositiveIntegerText(input.installationId, "GitHub App installation id");
  for (let page = 1; page <= MAX_USER_INSTALLATION_PAGES; page += 1) {
    const payload = await requestGitHubJson<{
      installations?: GitHubAppInstallationPayload[];
    }>({
      accessToken: input.accessToken,
      fetcher: input.fetcher,
      path: `/user/installations?per_page=100&page=${page}`,
    });
    const installations = Array.isArray(payload.installations) ? payload.installations : [];
    const matching = installations.find((installation) => String(installation.id ?? "") === installationId);
    if (matching) {
      return normalizeInstallation({
        appId: configuration.appId,
        installation: matching,
        installationId,
      });
    }
    if (installations.length < 100) {
      break;
    }
  }
  throw new ProviderRequestError(403, "The authorizing GitHub user cannot access this GitHub App installation.");
}

async function getGitHubAppInstallation(input: {
  appId: string;
  appJwt: string;
  fetcher: typeof fetch;
  installationId: string;
}): Promise<GitHubAppInstallation> {
  const payload = await requestGitHubJson<GitHubAppInstallationPayload>({
    accessToken: input.appJwt,
    fetcher: input.fetcher,
    path: `/app/installations/${encodeURIComponent(input.installationId)}`,
  });
  return normalizeInstallation({
    appId: input.appId,
    installation: payload,
    installationId: input.installationId,
  });
}

function normalizeInstallation(input: {
  appId: string;
  installation: GitHubAppInstallationPayload;
  installationId: string;
}): GitHubAppInstallation {
  if (String(input.installation.app_id ?? "") !== input.appId) {
    throw new ProviderRequestError(403, "The GitHub App installation belongs to a different app.");
  }
  if (input.installation.suspended_at) {
    throw new ProviderRequestError(403, "The GitHub App installation is suspended.");
  }
  const accountType = input.installation.account?.type;
  if (accountType !== "Organization" && accountType !== "User") {
    throw providerResponseError("GitHub App installation account type is missing.");
  }
  return {
    accountId: requiredString(
      input.installation.account?.id === undefined ? undefined : String(input.installation.account.id),
      "GitHub App installation account id",
      providerResponseError,
    ),
    accountLogin: requiredString(
      input.installation.account?.login,
      "GitHub App installation account login",
      providerResponseError,
    ),
    accountType,
    installationId: input.installationId,
    permissions: normalizePermissions(input.installation.permissions),
    repositorySelection: normalizeRepositorySelection(input.installation.repository_selection),
  };
}

async function requestGitHubJson<T>(input: {
  accessToken: string;
  body?: Record<string, unknown>;
  fetcher: typeof fetch;
  method?: string;
  path: string;
}): Promise<T> {
  const response = await input.fetcher(`${githubApiBaseUrl}${input.path}`, {
    method: input.method ?? "GET",
    headers: githubHeaders(input.accessToken, input.body !== undefined),
    body: input.body === undefined ? undefined : JSON.stringify(input.body),
  });
  const payload = await readJsonResponse(response);
  if (!response.ok) {
    throw normalizeGitHubError(response, payload, "github app request failed");
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw providerResponseError("GitHub App returned an invalid response.");
  }
  return payload as T;
}

function readGitHubAppRuntimeConfiguration(runtimeConfig?: RuntimeConfigReader): {
  appId: string;
  privateKeyPem: string;
} {
  const appId = requireRuntimeConfig(runtimeConfig, githubAppIdConfigName);
  const privateKeyPem = requireRuntimeConfig(runtimeConfig, githubAppPrivateKeyConfigName);
  return {
    appId: requirePositiveIntegerText(appId, "GitHub App id"),
    privateKeyPem,
  };
}

function requireRuntimeConfig(runtimeConfig: RuntimeConfigReader | undefined, name: string): string {
  const value = runtimeConfig?.(name)?.trim() ?? "";
  if (!value) {
    throw new ProviderRequestError(503, `${name} is not configured.`);
  }
  return value;
}

function normalizePrivateKey(value: string): string {
  return value.trim().replace(/\\n/gu, "\n");
}

function requirePositiveIntegerText(value: string, fieldName: string): string {
  const normalized = value.trim();
  const parsed = Number(normalized);
  if (!/^[1-9][0-9]*$/u.test(normalized) || !Number.isSafeInteger(parsed)) {
    throw new ProviderRequestError(400, `${fieldName} must be a positive integer.`);
  }
  return normalized;
}

function normalizePermissions(value: Record<string, unknown> | undefined): Record<string, string> {
  if (!value) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(value).flatMap(([key, permission]) =>
      typeof permission === "string" && permission ? [[key, permission]] : [],
    ),
  );
}

function normalizeRepositorySelection(value: unknown): "all" | "selected" {
  if (value === "all" || value === "selected") {
    return value;
  }
  throw providerResponseError("GitHub App installation repository selection is missing.");
}

function providerResponseError(message: string): ProviderRequestError {
  return new ProviderRequestError(502, message);
}
