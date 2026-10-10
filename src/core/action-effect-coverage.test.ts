import type { ResolvedCredential } from "./types.ts";

import { afterEach, describe, expect, it, vi } from "vitest";
import { createCatalogStore } from "../catalog-store.ts";
import { provider as aliyunAck } from "../providers/aliyun_ack/definition.ts";
import { provider as aliyunOss } from "../providers/aliyun_oss/definition.ts";
import { executors as ossExecutors } from "../providers/aliyun_oss/executors.ts";
import { provider as awsS3 } from "../providers/aws_s3/definition.ts";
import { executors as s3Executors } from "../providers/aws_s3/executors.ts";
import { provider as cloudflareMcp } from "../providers/cloudflare_mcp/definition.ts";
import { provider as github } from "../providers/github/definition.ts";
import { provider as gmail } from "../providers/gmail/definition.ts";
import { serializeRuntimeAction } from "../server/api/runtime-api.ts";
import { executeAction } from "./execution.ts";

describe("OpenMeld action metadata compatibility", () => {
  const catalog = createCatalogStore([github, gmail, awsS3, aliyunOss, aliyunAck, cloudflareMcp]);
  afterEach(() => vi.unstubAllGlobals());
  it.each([
    ["gmail.fetch_emails", "read"],
    ["gmail.send_email", "write"],
    ["gmail.move_to_trash", "destructive"],
    ["github.get_repository", "read"],
    ["github.create_issue", "write"],
    ["github.delete_repository", "destructive"],
    ["aws_s3.generate_presigned_url", "destructive"],
    ["aliyun_oss.generate_presigned_url", "destructive"],
    ["aliyun_ack.get_temporary_kubeconfig", "destructive"],
    ["cloudflare_mcp.execute", "destructive"],
  ] as const)("reports %s as %s through both client contracts", (actionId, effect) => {
    const action = catalog.actionsById.get(actionId);
    if (!action) throw new Error(`Missing action ${actionId}`);
    expect(serializeRuntimeAction(action)).toMatchObject({ effect, operationType: effect });
  });

  it.each([
    ["aws_s3", "GET"],
    ["aws_s3", "PUT"],
    ["aws_s3", "DELETE"],
    ["aliyun_oss", "GET"],
    ["aliyun_oss", "PUT"],
    ["aliyun_oss", "DELETE"],
  ] as const)("keeps %s signed %s capability behind destructive metadata", async (service, method) => {
    const fetch = vi.fn(() => {
      throw new Error("Presigning must not send a provider request");
    });
    vi.stubGlobal("fetch", fetch);
    const action = catalog.actionsById.get(`${service}.generate_presigned_url`)!;
    const credential: ResolvedCredential = {
      authType: "custom_credential",
      values: {
        accessKeyId: "SYNTHETIC_AUDIT_KEY",
        secretAccessKey: "synthetic-audit-secret",
        accessKeySecret: "synthetic-audit-secret",
        region: "us-east-1",
        endpoint: "oss-cn-hangzhou.aliyuncs.com",
        bucket: "audit-only",
      },
      profile: { accountId: "synthetic", displayName: "Synthetic audit", grantedScopes: [] },
      metadata: {},
    };
    const executors = service === "aws_s3" ? s3Executors : ossExecutors;
    const result = await executeAction(
      action,
      executors[`${service}.generate_presigned_url`],
      {
        objectKey: "never-created-audit-object",
        method,
        expiresSeconds: 60,
      },
      { getCredential: async () => credential },
    );
    expect(result).toMatchObject({ ok: true, output: { method } });
    const output = result.output as { url: string };
    expect(new URL(output.url).searchParams.has(service === "aws_s3" ? "X-Amz-Signature" : "Signature")).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
    // The mixed action also grants DELETE and overwrite-capable PUT URLs.
    // A GET input must not downgrade its static client authorization contract.
    expect(serializeRuntimeAction(action)).toMatchObject({ effect: "destructive", operationType: "destructive" });
  });
});
