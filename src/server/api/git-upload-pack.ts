import type { ConnectionService } from "../../connection-service.ts";
import type { Logger } from "../logger.ts";
import type { LocalAuthOptions } from "./auth.ts";
import type { Context } from "hono";

import { providerFetch } from "../../providers/provider-runtime.ts";
import { hasConfiguredAdminBearer } from "./auth.ts";
import { jsonError } from "./http-utils.ts";

type GitOperation = "advertise" | "upload";

export interface GitUploadPackDependencies {
  auth: LocalAuthOptions;
  connections: ConnectionService;
  logger?: Logger;
  fetcher?: typeof fetch;
}

const repositoryPart = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,99}$/u;
const identifier = /^[A-Za-z0-9_-]{1,128}$/u;
const operationIdentifier = /^[A-Za-z0-9_-]{1,128}$/u;
const redirectStatuses = new Set([301, 302, 303, 307, 308]);

/**
 * The administrator is the trusted OpenMeld Gateway. It authenticates the
 * requester and selects a repository on every HTTP exchange. This endpoint
 * derives the member connection instead of accepting a connection selector:
 * neither a runtime token nor the Computer can choose the Organization App.
 */
export async function handleGitUploadPack(
  context: Context,
  input: GitUploadPackDependencies & { operation: GitOperation; owner: string; repo: string },
): Promise<Response> {
  if (!hasConfiguredAdminBearer(context, input.auth)) {
    return jsonError(context, 401, "unauthorized", "The OpenMeld Git transfer requires administrator authentication.");
  }

  const organizationId = context.req.header("x-openmeld-organization-id") ?? "";
  const requesterUserId = context.req.header("x-openmeld-requester-user-id") ?? "";
  const operationId = context.req.header("x-openmeld-operation-id") ?? "";
  if (!identifier.test(organizationId) || !identifier.test(requesterUserId) || !operationIdentifier.test(operationId)) {
    return jsonError(context, 400, "invalid_git_request", "A verified requester and operation are required.");
  }
  if (
    !repositoryPart.test(input.owner) ||
    !repositoryPart.test(input.repo) ||
    input.owner === "." ||
    input.repo === "." ||
    input.repo === ".."
  ) {
    return jsonError(context, 400, "invalid_git_repository", "Select one exact GitHub repository.");
  }
  if (context.req.header("x-openmeld-repository") !== `${input.owner}/${input.repo}`) {
    return jsonError(context, 400, "git_repository_mismatch", "The Git transfer repository does not match its grant.");
  }
  if (input.operation === "advertise") {
    const query = new URL(context.req.url).searchParams;
    if (query.size !== 1 || query.get("service") !== "git-upload-pack") {
      return jsonError(context, 400, "invalid_git_service", "Only git-upload-pack is available.");
    }
  } else if (
    context.req.header("content-type")?.split(";", 1)[0]?.trim().toLowerCase() !==
    "application/x-git-upload-pack-request"
  ) {
    return jsonError(context, 400, "invalid_git_content_type", "A git-upload-pack request is required.");
  }
  const gitProtocol = context.req.header("git-protocol");
  if (gitProtocol && gitProtocol !== "version=2") {
    return jsonError(context, 400, "invalid_git_protocol", "Only Git protocol version 2 is supported.");
  }

  const connectionName = await requesterConnectionName(organizationId, requesterUserId);
  const credential = await input.connections.getCredential("github", connectionName).catch(() => undefined);
  if (!credential || (credential.authType !== "oauth2" && credential.authType !== "api_key")) {
    return jsonError(
      context,
      404,
      "github_connection_unavailable",
      "The requester's GitHub connection is unavailable.",
    );
  }

  const token = credential.authType === "oauth2" ? credential.accessToken : credential.apiKey;
  const suffix = input.operation === "advertise" ? "/info/refs?service=git-upload-pack" : "/git-upload-pack";
  const url = `https://github.com/${input.owner}/${input.repo}.git${suffix}`;
  const headers = new Headers({
    authorization: `Basic ${Buffer.from(`x-access-token:${token}`).toString("base64")}`,
    accept:
      input.operation === "advertise"
        ? "application/x-git-upload-pack-advertisement"
        : "application/x-git-upload-pack-result",
  });
  if (gitProtocol) headers.set("git-protocol", gitProtocol);
  if (input.operation === "upload") headers.set("content-type", "application/x-git-upload-pack-request");

  input.logger?.info(
    {
      organizationId,
      requesterUserId,
      operationId,
      repository: `${input.owner}/${input.repo}`,
      gitOperation: input.operation,
    },
    "OpenMeld Git transfer started",
  );
  let upstream: Response;
  try {
    upstream = await (input.fetcher ?? providerFetch)(url, {
      method: input.operation === "advertise" ? "GET" : "POST",
      headers,
      body: input.operation === "upload" ? context.req.raw.body : undefined,
      redirect: "manual",
      signal: context.req.raw.signal,
      // Node fetch requires duplex for a streaming POST. Workers ignores it.
      ...(input.operation === "upload" ? { duplex: "half" } : {}),
    } as RequestInit);
  } catch (error) {
    input.logger?.warn({ err: error, operationId }, "OpenMeld Git upstream request failed");
    return jsonError(context, 502, "git_upstream_unavailable", "GitHub transfer could not start.");
  }
  if (redirectStatuses.has(upstream.status)) {
    await upstream.body?.cancel();
    return jsonError(context, 502, "git_redirect_rejected", "GitHub redirected the Git transfer.");
  }
  if (!upstream.ok || !upstream.body) {
    await upstream.body?.cancel();
    return jsonError(
      context,
      upstream.status === 404 ? 404 : 502,
      "git_upstream_rejected",
      "GitHub did not accept the Git transfer.",
    );
  }
  const expectedType =
    input.operation === "advertise"
      ? "application/x-git-upload-pack-advertisement"
      : "application/x-git-upload-pack-result";
  if (upstream.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase() !== expectedType) {
    await upstream.body.cancel();
    return jsonError(context, 502, "git_upstream_protocol", "GitHub returned an unexpected Git response.");
  }
  input.logger?.info({ operationId, status: upstream.status }, "OpenMeld Git transfer accepted");
  return new Response(upstream.body, {
    status: upstream.status,
    headers: { "content-type": expectedType, "cache-control": "no-store" },
  });
}

async function requesterConnectionName(organizationId: string, requesterUserId: string): Promise<string> {
  const [organizationHash, userHash] = await Promise.all([
    stableIdentifierHash(organizationId),
    stableIdentifierHash(requesterUserId),
  ]);
  return `org_${organizationHash}__user_${userHash}__github`;
}

async function stableIdentifierHash(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Buffer.from(digest).toString("base64url").slice(0, 18);
}
