import type { AppleAdsContext, AppleAdsHandlers } from "./runtime-helpers.ts";

import {
  compactObject,
  looseArray,
  optionalBoolean,
  optionalInteger,
  optionalString,
  recordOrEmpty,
} from "../../core/cast.ts";
import { ProviderRequestError, requiredInputString, requiredResponseRecord } from "../provider-runtime.ts";
import {
  readAppleAdsId,
  readOptionalAppleAdsId,
  readOptionalResult,
  readPagination,
  readResult,
  readResultCollection,
  requestAppleAds,
  resolveAdAccountId,
} from "./runtime-helpers.ts";

const impressionSharePath = "/v1/insights/apps/impression-share/query";
const searchTermPopularityPath = "/v1/insights/apps/search-term-popularity/query";
const targetCpaRecommendationsPath = "/v1/recommendations/target-cpas";
const dailyBudgetRecommendationsPath = "/v1/recommendations/daily-budgets";
const keywordSuggestionsPath = "/v1/suggestions/keywords/query";
const phraseSuggestionsPath = "/v1/suggestions/phrases/query";
const categorySuggestionsPath = "/v1/suggestions/categories/query";
const targetCpaSuggestionPath = "/v1/suggestions/target-cpas/query";

function requireSuggestionRoute(input: Record<string, unknown>, exactField: string, patternField: string): void {
  const complete =
    input.queryType === "SUGGESTION"
      ? input.promotedObjectId !== undefined && input.promotedObjectType !== undefined
      : input[exactField] !== undefined || input[patternField] !== undefined;
  if (!complete) {
    throw new ProviderRequestError(
      400,
      `queryType SUGGESTION needs promotedObjectId and promotedObjectType; queryType SEARCH needs ${exactField} or ${patternField}.`,
    );
  }
}

const impressionShareLabel = "Apple Ads impression share";
const searchTermPopularityLabel = "Apple Ads search term popularity";
const targetCpaRecommendationLabel = "Apple Ads target CPA recommendation";
const targetCpaHistoryLabel = "Apple Ads target CPA recommendation history";
const dailyBudgetRecommendationLabel = "Apple Ads daily budget recommendation";
const dailyBudgetHistoryLabel = "Apple Ads daily budget recommendation history";
const keywordSuggestionLabel = "Apple Ads keyword suggestion";
const phraseSuggestionLabel = "Apple Ads phrase suggestion";
const categorySuggestionLabel = "Apple Ads category suggestion";
const targetCpaSuggestionLabel = "Apple Ads target CPA suggestion";

const appStoreAppPromotedObjectType = "APPSTORE_APP";

export const appleAdsInsightHandlers: AppleAdsHandlers = {
  async query_impression_share(input, context) {
    const { payload } = await requestAppleAds(context, {
      method: "POST",
      path: impressionSharePath,
      adAccountId: resolveAdAccountId(input, context),
      body: compactObject({
        filters: impressionShareFilters(input),
        sorting: nonEmptyArray(input.sorting),
        timeRange: input.timeRange,
        pagination: readReportPagination(input),
        options: readImpressionShareOptions(input),
      }),
    });
    return {
      rows: readRows(payload, impressionShareLabel),
      pagination: readPagination(payload),
    };
  },

  async query_search_term_popularity(input, context) {
    const { payload } = await requestAppleAds(context, {
      method: "POST",
      path: searchTermPopularityPath,
      adAccountId: resolveAdAccountId(input, context),
      body: compactObject({
        fields: nonEmptyArray(input.fields),
        filters: nonEmptyArray(input.filters),
        sorting: nonEmptyArray(input.sorting),
        timeRange: input.timeRange,
        pagination: readReportPagination(input),
      }),
    });
    return {
      rows: readRows(payload, searchTermPopularityLabel),
      pagination: readPagination(payload),
    };
  },

  async query_target_cpa_recommendations(input, context) {
    return queryRecommendations(context, input, {
      path: `${targetCpaRecommendationsPath}/query`,
      label: targetCpaRecommendationLabel,
      filters: [...promotedObjectFilters(input), ...stateFilter(input)],
    });
  },

  async apply_target_cpa_recommendations(input, context) {
    return {
      histories: await postRecommendationItems(context, input, {
        path: `${targetCpaRecommendationsPath}/apply`,
        label: targetCpaHistoryLabel,
        appliedField: "appliedTargetCPA",
      }),
    };
  },

  async dismiss_target_cpa_recommendations(input, context) {
    return {
      histories: await postRecommendationItems(context, input, {
        path: `${targetCpaRecommendationsPath}/dismiss`,
        label: targetCpaHistoryLabel,
      }),
    };
  },

  async query_daily_budget_recommendations(input, context) {
    return queryRecommendations(context, input, {
      path: `${dailyBudgetRecommendationsPath}/query`,
      label: dailyBudgetRecommendationLabel,
      filters: [...promotedObjectFilters(input), ...stateFilter(input), ...campaignIdFilter(input)],
    });
  },

  async apply_daily_budget_recommendations(input, context) {
    return {
      histories: await postRecommendationItems(context, input, {
        path: `${dailyBudgetRecommendationsPath}/apply`,
        label: dailyBudgetHistoryLabel,
        appliedField: "appliedDailyBudget",
      }),
    };
  },

  async dismiss_daily_budget_recommendations(input, context) {
    return {
      histories: await postRecommendationItems(context, input, {
        path: `${dailyBudgetRecommendationsPath}/dismiss`,
        label: dailyBudgetHistoryLabel,
      }),
    };
  },

  async query_keyword_suggestions(input, context) {
    const page = await querySuggestions(context, input, {
      path: keywordSuggestionsPath,
      label: keywordSuggestionLabel,
      filters: [
        ...promotedObjectFilters(input),
        ...inFilter("terms", input.terms),
        ...inFilter("countriesOrRegions", input.countriesOrRegions),
      ],
    });
    return { keywords: page.items, pagination: page.pagination };
  },

  async query_phrase_suggestions(input, context) {
    requireSuggestionRoute(input, "phrases", "phraseLike");
    const ignoreCase = optionalBoolean(input.ignoreCase);
    const page = await querySuggestions(context, input, {
      path: phraseSuggestionsPath,
      label: phraseSuggestionLabel,
      filters: [
        ...queryTypeFilter(input),
        ...optionalPromotedObjectFilters(input),
        ...inFilter("phrase", input.phrases, ignoreCase),
        ...likeFilter("phrase", input.phraseLike, ignoreCase),
      ],
    });
    return { phrases: page.items, pagination: page.pagination };
  },

  async query_category_suggestions(input, context) {
    requireSuggestionRoute(input, "categories", "categoryLike");
    const ignoreCase = optionalBoolean(input.ignoreCase);
    const page = await querySuggestions(context, input, {
      path: categorySuggestionsPath,
      label: categorySuggestionLabel,
      filters: [
        ...queryTypeFilter(input),
        ...optionalPromotedObjectFilters(input),
        ...inFilter("category", input.categories, ignoreCase),
        ...likeFilter("category", input.categoryLike, ignoreCase),
      ],
    });
    return { categories: page.items, pagination: page.pagination };
  },

  async query_target_cpa_suggestion(input, context) {
    const { payload } = await requestAppleAds(context, {
      method: "POST",
      path: targetCpaSuggestionPath,
      adAccountId: resolveAdAccountId(input, context),
      body: {
        filters: [
          filterCondition("promotedObjectId", "EQUALS", [readAppleAdsId(input.promotedObjectId, "promotedObjectId")]),
          filterCondition("promotedObjectType", "EQUALS", [appStoreAppPromotedObjectType]),
          ...inFilter("countryOrRegion", input.countryOrRegion),
        ],
      },
    });
    return { suggestion: readOptionalResult(payload, targetCpaSuggestionLabel) };
  },
};

interface RecommendationQuery {
  path: string;
  label: string;
  filters: Array<Record<string, unknown>>;
}

async function queryRecommendations(
  context: AppleAdsContext,
  input: Record<string, unknown>,
  request: RecommendationQuery,
) {
  const page = await querySuggestions(context, input, request);
  return { recommendations: page.items, pagination: page.pagination };
}

async function querySuggestions(
  context: AppleAdsContext,
  input: Record<string, unknown>,
  request: RecommendationQuery,
) {
  const { payload } = await requestAppleAds(context, {
    method: "POST",
    path: request.path,
    adAccountId: resolveAdAccountId(input, context),
    body: compactObject({
      filters: request.filters,
      sorting: nonEmptyArray(input.sorting),
      pagination: readReportPagination(input),
    }),
  });
  return {
    items: readResultCollection(payload, request.label),
    pagination: readPagination(payload),
  };
}

interface RecommendationItemsRequest {
  path: string;
  label: string;
  appliedField?: "appliedTargetCPA" | "appliedDailyBudget";
}

async function postRecommendationItems(
  context: AppleAdsContext,
  input: Record<string, unknown>,
  request: RecommendationItemsRequest,
): Promise<Array<Record<string, unknown>>> {
  const promotedObjectId = readAppleAdsId(input.promotedObjectId, "promotedObjectId");
  const promotedObjectType = requiredInputString(input.promotedObjectType, "promotedObjectType");
  const body = looseArray(input.recommendations).map((entry, index) => {
    const item = recordOrEmpty(entry);
    const appliedValue = request.appliedField === undefined ? undefined : item[request.appliedField];
    return compactObject({
      id: requiredInputString(item.id, `recommendations[${index}].id`),
      promotedObjectId,
      promotedObjectType,
      appliedTargetCPA: request.appliedField === "appliedTargetCPA" ? appliedValue : undefined,
      appliedDailyBudget: request.appliedField === "appliedDailyBudget" ? appliedValue : undefined,
      historyId: optionalString(item.historyId),
    });
  });

  const { payload } = await requestAppleAds(context, {
    method: "POST",
    path: request.path,
    adAccountId: resolveAdAccountId(input, context),
    body,
  });
  return readResultCollection(payload, request.label);
}

function filterCondition(
  field: string,
  operator: string,
  value: readonly string[],
  ignoreCase?: boolean,
): Record<string, unknown> {
  return compactObject({ field, operator, value: [...value], ignoreCase });
}

function promotedObjectFilters(input: Record<string, unknown>): Array<Record<string, unknown>> {
  return [
    filterCondition("promotedObjectId", "EQUALS", [readAppleAdsId(input.promotedObjectId, "promotedObjectId")]),
    filterCondition("promotedObjectType", "EQUALS", [
      requiredInputString(input.promotedObjectType, "promotedObjectType"),
    ]),
  ];
}

function optionalPromotedObjectFilters(input: Record<string, unknown>): Array<Record<string, unknown>> {
  const filters: Array<Record<string, unknown>> = [];
  const promotedObjectId = readOptionalAppleAdsId(input.promotedObjectId, "promotedObjectId");
  if (promotedObjectId !== undefined) {
    filters.push(filterCondition("promotedObjectId", "EQUALS", [promotedObjectId]));
  }
  const promotedObjectType = optionalString(input.promotedObjectType);
  if (promotedObjectType !== undefined) {
    filters.push(filterCondition("promotedObjectType", "EQUALS", [promotedObjectType]));
  }

  return filters;
}

function queryTypeFilter(input: Record<string, unknown>): Array<Record<string, unknown>> {
  return [filterCondition("queryType", "EQUALS", [requiredInputString(input.queryType, "queryType")])];
}

function stateFilter(input: Record<string, unknown>): Array<Record<string, unknown>> {
  const state = optionalString(input.state);
  return state === undefined ? [] : [filterCondition("state", "EQUALS", [state])];
}

function campaignIdFilter(input: Record<string, unknown>): Array<Record<string, unknown>> {
  const campaignIds = looseArray(input.campaignIds).map((value) => readAppleAdsId(value, "campaignIds[]"));
  return campaignIds.length === 0 ? [] : [filterCondition("campaignId", "IN", campaignIds)];
}

function inFilter(field: string, value: unknown, ignoreCase?: boolean): Array<Record<string, unknown>> {
  const values = looseArray(value).map((item) => String(item));
  return values.length === 0 ? [] : [filterCondition(field, "IN", values, ignoreCase)];
}

function likeFilter(field: string, value: unknown, ignoreCase?: boolean): Array<Record<string, unknown>> {
  const pattern = optionalString(value);
  return pattern === undefined ? [] : [filterCondition(field, "LIKE", [pattern], ignoreCase)];
}

function impressionShareFilters(input: Record<string, unknown>): Array<Record<string, unknown>> {
  const filters = [
    {
      field: "promotedObjectId",
      operator: "EQUALS",
      value: readAppleAdsId(input.promotedObjectId, "promotedObjectId"),
    },
  ];
  const countryOrRegion = optionalString(input.countryOrRegion);
  if (countryOrRegion !== undefined) {
    filters.push({ field: "countryOrRegion", operator: "EQUALS", value: countryOrRegion });
  }

  return filters;
}

function readImpressionShareOptions(input: Record<string, unknown>): Record<string, unknown> | undefined {
  const reportType = optionalString(input.impressionShareReportType);
  return reportType === undefined ? undefined : { impressionShareReportType: reportType };
}

function readReportPagination(input: Record<string, unknown>): Record<string, unknown> | undefined {
  const pagination = compactObject({
    offset: optionalInteger(input.offset),
    pageSize: optionalInteger(input.pageSize),
  });
  return Object.keys(pagination).length === 0 ? undefined : pagination;
}

function nonEmptyArray(value: unknown): unknown[] | undefined {
  const items = looseArray(value);
  return items.length === 0 ? undefined : items;
}

function readRows(payload: unknown, label: string): Array<Record<string, unknown>> {
  const result = readResult(payload, label);
  return looseArray(result.rows).map((row) => requiredResponseRecord(row, `${label} row`));
}
