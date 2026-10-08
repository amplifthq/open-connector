import { optionalRecord } from "../../../core/cast.ts";
import { providerResponseError } from "../../provider-runtime.ts";
import { requireFeishuResponseString } from "./response.ts";

export function extractFeishuMailDraftId(data: Record<string, unknown>, fallback?: string): string {
  return requireFeishuResponseString(optionalRecord(data.draft)?.id ?? fallback, "draft.id");
}

export interface FeishuMailMessagePage {
  items: string[];
  hasMore: boolean;
  pageToken: string | null;
}

export function readFeishuMailMessagePage(data: Record<string, unknown>): FeishuMailMessagePage {
  const items = data.items;
  if (!Array.isArray(items) || !items.every((item): item is string => typeof item === "string" && item.length > 0))
    throw providerResponseError("Feishu mail response items must be an array of non-empty message IDs");
  const hasMore = data.has_more === true;
  return {
    items,
    hasMore,
    pageToken: hasMore ? requireFeishuResponseString(data.page_token, "page_token") : null,
  };
}
