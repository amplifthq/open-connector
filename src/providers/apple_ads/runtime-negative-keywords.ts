import type { AppleAdsContext, AppleAdsHandlers } from "./runtime-helpers.ts";

import {
  compactObject,
  looseArray,
  optionalBoolean,
  optionalRecord,
  optionalStringOrNull,
  recordOrEmpty,
} from "../../core/cast.ts";
import { ProviderRequestError } from "../provider-runtime.ts";
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

const negativeKeywordsPath = "/v1/negative-keywords";
const negativeKeywordLabel = "Apple Ads negative keyword";
const bulkLabel = "Apple Ads negative keyword bulk result";

interface BulkItem {
  correlationId: number;
  data: Record<string, unknown>;
}

export const appleAdsNegativeKeywordHandlers: AppleAdsHandlers = {
  async query_negative_keywords(input, context) {
    const page = await queryAppleAds(context, input, {
      path: `${negativeKeywordsPath}/query`,
      label: negativeKeywordLabel,
      adAccountId: resolveAdAccountId(input, context),
    });
    return { negativeKeywords: page.items, pagination: page.pagination };
  },

  async get_negative_keyword(input, context) {
    return {
      negativeKeyword: await getAppleAdsResource(context, {
        path: resourcePath(negativeKeywordsPath, readAppleAdsId(input.negativeKeywordId, "negativeKeywordId")),
        label: negativeKeywordLabel,
        adAccountId: resolveAdAccountId(input, context),
      }),
    };
  },

  async create_negative_keyword(input, context) {
    const campaignId = readOptionalNumericId(input.campaignId, "campaignId");
    const adGroupId = readOptionalNumericId(input.adGroupId, "adGroupId");
    requireSingleScope(campaignId, adGroupId, "create_negative_keyword");

    return {
      negativeKeyword: await createAppleAdsResource(context, {
        path: negativeKeywordsPath,
        label: negativeKeywordLabel,
        adAccountId: resolveAdAccountId(input, context),
        body: compactObject({
          campaignId,
          adGroupId,
          text: input.text,
          matchType: input.matchType,
          status: input.status,
        }),
      }),
    };
  },

  async update_negative_keyword(input, context) {
    const body = compactObject({ status: input.status });
    requireAnyAttribute(
      body,
      "update_negative_keyword requires status, the only field Apple Ads allows changing on a negative keyword",
    );

    return {
      negativeKeyword: await updateAppleAdsResource(context, {
        path: resourcePath(negativeKeywordsPath, readAppleAdsId(input.negativeKeywordId, "negativeKeywordId")),
        label: negativeKeywordLabel,
        adAccountId: resolveAdAccountId(input, context),
        body,
      }),
    };
  },

  async delete_negative_keyword(input, context) {
    const negativeKeywordId = readAppleAdsId(input.negativeKeywordId, "negativeKeywordId");
    await deleteAppleAdsResource(context, {
      path: resourcePath(negativeKeywordsPath, negativeKeywordId),
      label: negativeKeywordLabel,
      adAccountId: resolveAdAccountId(input, context),
    });
    return { id: negativeKeywordId, deleted: true };
  },

  async bulk_create_negative_keywords(input, context) {
    const items = readBulkItems(input, (payload, index) => {
      const campaignId = readOptionalNumericId(payload.campaignId, `negativeKeywords[${index}].campaignId`);
      const adGroupId = readOptionalNumericId(payload.adGroupId, `negativeKeywords[${index}].adGroupId`);
      requireSingleScope(campaignId, adGroupId, `negativeKeywords[${index}]`);

      return compactObject({
        campaignId,
        adGroupId,
        text: payload.text,
        matchType: payload.matchType,
        status: payload.status,
      });
    });

    return {
      results: await postBulkNegativeKeywords(context, input, "bulk-create", items),
    };
  },

  async bulk_update_negative_keywords(input, context) {
    const items = readBulkItems(input, (payload, index) => ({
      id: readAppleAdsNumericId(payload.id, `negativeKeywords[${index}].id`),
      status: payload.status,
    }));

    return {
      results: await postBulkNegativeKeywords(context, input, "bulk-update", items),
    };
  },
};

function readBulkItems(
  input: Record<string, unknown>,
  readData: (payload: Record<string, unknown>, index: number) => Record<string, unknown>,
): BulkItem[] {
  return looseArray(input.negativeKeywords).map((item, index) => ({
    correlationId: index,
    data: readData(recordOrEmpty(item), index),
  }));
}

async function postBulkNegativeKeywords(
  context: AppleAdsContext,
  input: Record<string, unknown>,
  operation: "bulk-create" | "bulk-update",
  items: BulkItem[],
): Promise<Array<Record<string, unknown>>> {
  const { payload } = await requestAppleAds(context, {
    method: "POST",
    path: `${negativeKeywordsPath}/${operation}`,
    body: compactObject({
      allowPartialSuccess: optionalBoolean(input.allowPartialSuccess),
      items,
    }),
    adAccountId: resolveAdAccountId(input, context),
  });

  return readResultCollection(payload, bulkLabel).map((entry, index) => ({
    correlationId: readResponseInteger(entry.correlationId) ?? index,
    operation: optionalStringOrNull(entry.operation),
    success: optionalBoolean(entry.success) ?? null,
    negativeKeyword: optionalRecord(entry.result) ?? null,
    error: optionalRecord(entry.error) ?? null,
  }));
}

function requireSingleScope(campaignId: number | undefined, adGroupId: number | undefined, subject: string): void {
  if ((campaignId === undefined) === (adGroupId === undefined)) {
    throw new ProviderRequestError(
      400,
      `${subject} requires exactly one of campaignId, for a campaign-level exclusion, or adGroupId, for an ad group-level one`,
    );
  }
}

function readOptionalNumericId(value: unknown, fieldName: string): number | undefined {
  return value === undefined || value === null || value === "" ? undefined : readAppleAdsNumericId(value, fieldName);
}
