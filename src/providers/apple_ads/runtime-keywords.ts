import type { AppleAdsContext, AppleAdsHandlers } from "./runtime-helpers.ts";

import {
  compactObject,
  looseArray,
  optionalBoolean,
  optionalRecord,
  optionalStringOrNull,
  recordOrEmpty,
} from "../../core/cast.ts";
import {
  createAppleAdsResource,
  deleteAppleAdsResource,
  getAppleAdsResource,
  queryAppleAds,
  readAppleAdsId,
  readAppleAdsNumericId,
  readResponseInteger,
  readResultCollection,
  requestAppleAds,
  requireAnyAttribute,
  resolveAdAccountId,
  resourcePath,
  updateAppleAdsResource,
} from "./runtime-helpers.ts";

const keywordsPath = "/v1/keywords";
const keywordLabel = "Apple Ads keyword";
const bulkKeywordLabel = "Apple Ads keyword bulk operation";

export const appleAdsKeywordHandlers: AppleAdsHandlers = {
  async query_keywords(input, context) {
    const page = await queryAppleAds(context, input, {
      path: `${keywordsPath}/query`,
      label: keywordLabel,
      adAccountId: resolveAdAccountId(input, context),
    });
    return { keywords: page.items, pagination: page.pagination };
  },

  async get_keyword(input, context) {
    return {
      keyword: await getAppleAdsResource(context, {
        path: resourcePath(keywordsPath, readAppleAdsId(input.keywordId, "keywordId")),
        label: keywordLabel,
        adAccountId: resolveAdAccountId(input, context),
      }),
    };
  },

  async create_keyword(input, context) {
    return {
      keyword: await createAppleAdsResource(context, {
        path: keywordsPath,
        label: keywordLabel,
        adAccountId: resolveAdAccountId(input, context),
        body: compactObject({
          adGroupId: readAppleAdsNumericId(input.adGroupId, "adGroupId"),
          text: input.text,
          matchType: input.matchType,
          bid: input.bid,
          status: input.status,
        }),
      }),
    };
  },

  async update_keyword(input, context) {
    const body = compactObject({ bid: input.bid, status: input.status });
    requireAnyAttribute(body, "update_keyword requires bid or status to change");

    return {
      keyword: await updateAppleAdsResource(context, {
        path: resourcePath(keywordsPath, readAppleAdsId(input.keywordId, "keywordId")),
        label: keywordLabel,
        adAccountId: resolveAdAccountId(input, context),
        body,
      }),
    };
  },

  async delete_keyword(input, context) {
    const keywordId = readAppleAdsId(input.keywordId, "keywordId");
    await deleteAppleAdsResource(context, {
      path: resourcePath(keywordsPath, keywordId),
      label: keywordLabel,
      adAccountId: resolveAdAccountId(input, context),
    });
    return { id: keywordId, deleted: true };
  },

  async bulk_create_keywords(input, context) {
    const items = readBulkItems(input.keywords, (keyword, index) =>
      compactObject({
        adGroupId: readAppleAdsNumericId(keyword.adGroupId, `keywords[${index}].adGroupId`),
        text: keyword.text,
        matchType: keyword.matchType,
        bid: keyword.bid,
        status: keyword.status,
      }),
    );
    return runBulkKeywords(context, input, "bulk-create", items);
  },

  async bulk_update_keywords(input, context) {
    const items = readBulkItems(input.keywords, (keyword, index) => {
      requireAnyAttribute(
        { bid: keyword.bid, status: keyword.status },
        `keywords[${index}] requires bid or status to change`,
      );
      return compactObject({
        id: readAppleAdsNumericId(keyword.keywordId, `keywords[${index}].keywordId`),
        bid: keyword.bid,
        status: keyword.status,
      });
    });
    return runBulkKeywords(context, input, "bulk-update", items);
  },
};

function readBulkItems(
  value: unknown,
  readData: (keyword: Record<string, unknown>, index: number) => Record<string, unknown>,
): Array<{ correlationId: number; data: Record<string, unknown> }> {
  return looseArray(value).map((entry, index) => ({
    correlationId: index,
    data: readData(recordOrEmpty(entry), index),
  }));
}

async function runBulkKeywords(
  context: AppleAdsContext,
  input: Record<string, unknown>,
  suffix: string,
  items: Array<{ correlationId: number; data: Record<string, unknown> }>,
): Promise<{ results: unknown[] }> {
  const { payload } = await requestAppleAds(context, {
    method: "POST",
    path: `${keywordsPath}/${suffix}`,
    body: compactObject({
      allowPartialSuccess: optionalBoolean(input.allowPartialSuccess),
      items,
    }),
    adAccountId: resolveAdAccountId(input, context),
  });
  return {
    results: readResultCollection(payload, bulkKeywordLabel).map((item, index) => ({
      correlationId: readResponseInteger(item.correlationId) ?? index,
      operation: optionalStringOrNull(item.operation),
      success: optionalBoolean(item.success) ?? null,
      keyword: optionalRecord(item.result) ?? null,
      error: optionalRecord(item.error) ?? null,
    })),
  };
}
