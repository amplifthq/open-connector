import type { Client } from "@modelcontextprotocol/client";

import { optionalNumber, optionalRecord, optionalString } from "../../core/cast.ts";
import { ProviderRequestError } from "../provider-runtime.ts";

type McpToolResult = Awaited<ReturnType<Client["callTool"]>>;

export function normalizeXydcMcpToolResult(result: McpToolResult): unknown {
  const candidates: unknown[] = [];
  if (result.structuredContent) candidates.push(result.structuredContent);
  for (const item of result.content) {
    if (item.type != "text") continue;
    try {
      candidates.push(JSON.parse(item.text) as unknown);
    } catch {
      // The caller handles plain text as MCP content.
    }
  }
  for (const candidate of candidates) {
    const envelope = optionalRecord(candidate);
    const data = optionalRecord(envelope?.data);
    const failure = data?.error === true ? data : envelope?.error === true ? envelope : undefined;
    if (!failure) continue;
    const reason = optionalString(failure.reason);
    const message = optionalString(failure.message) ?? "XYDC MCP tool failed";
    const upstreamStatus = optionalNumber(failure.status) ?? optionalNumber(envelope?.status);
    const status = reason == "InvalidArguments" ? 400 : upstreamStatus == 429 ? 429 : 502;
    throw new ProviderRequestError(status, message, {
      providerCode: reason,
      upstreamStatus,
      actionableNextStep: optionalString(failure.actionable_next_step),
    });
  }
  if (result.isError) throw new ProviderRequestError(502, "XYDC MCP tool returned an error", result);
  if (result.structuredContent) return result.structuredContent;
  const text = result.content.find((item) => item.type == "text");
  if (text?.type == "text") {
    try {
      return JSON.parse(text.text) as unknown;
    } catch {
      return text.text;
    }
  }
  return result.content;
}
