import type { AppleAdsContext, AppleAdsHandlers } from "./runtime-helpers.ts";

import { compactObject, looseArray, optionalInteger, optionalRecord, recordOrEmpty } from "../../core/cast.ts";
import { ProviderRequestError, requiredResponseRecord } from "../provider-runtime.ts";
import { readPagination, readResult, requestAppleAds, resolveAdAccountId } from "./runtime-helpers.ts";

const reportsPath = "/v1/reports";
const appsPromotedObjectType = "apps";
const brandsPromotedObjectType = "business-brands";

interface AppleAdsReportRequest {
  promotedObjectType: string;
  entity: string;
  label: string;
  requireCampaignFilter: boolean;
}

export const appleAdsReportHandlers: AppleAdsHandlers = {
  async get_campaign_report(input, context) {
    return runAppleAdsReport(context, input, appsReport("campaigns", "campaign"));
  },

  async get_ad_group_report(input, context) {
    return runAppleAdsReport(context, input, appsReport("adgroups", "ad group"));
  },

  async get_ad_report(input, context) {
    return runAppleAdsReport(context, input, appsReport("ads", "ad"));
  },

  async get_keyword_report(input, context) {
    return runAppleAdsReport(context, input, appsReport("keywords", "keyword"));
  },

  async get_search_term_report(input, context) {
    return runAppleAdsReport(context, input, appsReport("searchterms", "search term"));
  },

  async get_brand_campaign_report(input, context) {
    return runAppleAdsReport(context, input, brandsReport("campaigns", "campaign"));
  },

  async get_brand_ad_group_report(input, context) {
    return runAppleAdsReport(context, input, brandsReport("adgroups", "ad group"));
  },

  async get_brand_ad_report(input, context) {
    return runAppleAdsReport(context, input, brandsReport("ads", "ad"));
  },

  async get_brand_keyword_report(input, context) {
    return runAppleAdsReport(context, input, brandsReport("keywords", "keyword"));
  },

  async get_brand_search_term_report(input, context) {
    return runAppleAdsReport(context, input, brandsReport("searchterms", "search term"));
  },
};

function appsReport(entity: string, label: string): AppleAdsReportRequest {
  return {
    promotedObjectType: appsPromotedObjectType,
    entity,
    label: `Apple Ads App Store ${label} report`,
    requireCampaignFilter: true,
  };
}

function brandsReport(entity: string, label: string): AppleAdsReportRequest {
  return {
    promotedObjectType: brandsPromotedObjectType,
    entity,
    label: `Apple Ads Apple Maps ${label} report`,
    requireCampaignFilter: false,
  };
}

async function runAppleAdsReport(
  context: AppleAdsContext,
  input: Record<string, unknown>,
  request: AppleAdsReportRequest,
): Promise<unknown> {
  const filters = looseArray(input.filters);
  if (request.requireCampaignFilter) {
    requireCampaignIdFilter(filters, request.label);
  }

  const { payload } = await requestAppleAds(context, {
    method: "POST",
    path: `${reportsPath}/${request.promotedObjectType}/${request.entity}/query`,
    body: buildReportBody(input, filters),
    adAccountId: resolveAdAccountId(input, context),
  });
  const result = readResult(payload, request.label);

  return {
    rows: looseArray(result.rows).map((row) => requiredResponseRecord(row, `${request.label} row`)),
    grandTotal: optionalRecord(recordOrEmpty(result.summary).grandTotal) ?? null,
    pagination: readPagination(payload),
  };
}

function buildReportBody(input: Record<string, unknown>, filters: unknown[]): Record<string, unknown> {
  const sorting = looseArray(input.sorting);
  const fields = looseArray(input.fields);
  const groupBy = looseArray(input.groupBy);
  const includeRows = looseArray(input.includeRows);
  const pagination = compactObject({
    offset: optionalInteger(input.offset),
    pageSize: optionalInteger(input.pageSize),
  });

  return compactObject({
    timeRange: input.timeRange,
    filters: filters.length > 0 ? filters : undefined,
    sorting: sorting.length > 0 ? sorting : undefined,
    fields: fields.length > 0 ? fields : undefined,
    groupBy: groupBy.length > 0 ? groupBy : undefined,
    pagination: Object.keys(pagination).length > 0 ? pagination : undefined,
    options: includeRows.length > 0 ? { includeRows } : undefined,
  });
}

function requireCampaignIdFilter(filters: unknown[], label: string): void {
  const scoped = filters.some((filter) => recordOrEmpty(filter).field === "campaignId");
  if (!scoped) {
    throw new ProviderRequestError(
      400,
      `${label} requires a filters entry on campaignId: every App Store report request must be scoped to at least one campaign.`,
    );
  }
}
