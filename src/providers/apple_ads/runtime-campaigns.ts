import type { AppleAdsHandlers } from "./runtime-helpers.ts";

import { compactObject, optionalRecord, recordOrEmpty } from "../../core/cast.ts";
import {
  createAppleAdsResource,
  deleteAppleAdsResource,
  getAppleAdsResource,
  queryAppleAds,
  readAppleAdsId,
  readAppleAdsNumericId,
  requireAnyAttribute,
  resolveAdAccountId,
  resourcePath,
  updateAppleAdsResource,
} from "./runtime-helpers.ts";

const campaignsPath = "/v1/campaigns";
const campaignLabel = "Apple Ads campaign";

export const appleAdsCampaignHandlers: AppleAdsHandlers = {
  async query_campaigns(input, context) {
    const page = await queryAppleAds(context, input, {
      path: `${campaignsPath}/query`,
      label: campaignLabel,
      adAccountId: resolveAdAccountId(input, context),
    });
    return { campaigns: page.items, pagination: page.pagination };
  },

  async get_campaign(input, context) {
    return {
      campaign: await getAppleAdsResource(context, {
        path: resourcePath(campaignsPath, readAppleAdsId(input.campaignId, "campaignId")),
        label: campaignLabel,
        adAccountId: resolveAdAccountId(input, context),
      }),
    };
  },

  async create_campaign(input, context) {
    const adAccountId = resolveAdAccountId(input, context);
    return {
      campaign: await createAppleAdsResource(context, {
        path: campaignsPath,
        label: campaignLabel,
        adAccountId,
        body: compactObject({
          adAccountId: readAppleAdsNumericId(adAccountId, "adAccountId"),
          name: input.name,
          promotedObjectType: input.promotedObjectType,
          promotedObjectId: input.promotedObjectId,
          billingEvent: input.billingEvent,
          dailyBudget: input.dailyBudget,
          targeting: input.targeting,
          bidStrategy: input.bidStrategy,
          startTime: input.startTime,
          endTime: input.endTime,
          status: input.status,
          sharedBudgets: readSharedBudgets(input.sharedBudgets),
          invoiceDetail: input.invoiceDetail,
          regulationResponses: input.regulationResponses,
        }),
      }),
    };
  },

  async update_campaign(input, context) {
    const body = compactObject({
      name: input.name,
      status: input.status,
      startTime: input.startTime,
      endTime: input.endTime,
      dailyBudget: input.dailyBudget,
      targeting: input.targeting,
      bidStrategy: input.bidStrategy,
      sharedBudgets: readSharedBudgets(input.sharedBudgets),
      invoiceDetail: input.invoiceDetail,
      regulationResponses: input.regulationResponses,
    });
    requireAnyAttribute(body, "update_campaign requires at least one field to change besides campaignId");

    return {
      campaign: await updateAppleAdsResource(context, {
        path: resourcePath(campaignsPath, readAppleAdsId(input.campaignId, "campaignId")),
        label: campaignLabel,
        adAccountId: resolveAdAccountId(input, context),
        body,
      }),
    };
  },

  async delete_campaign(input, context) {
    const campaignId = readAppleAdsId(input.campaignId, "campaignId");
    await deleteAppleAdsResource(context, {
      path: resourcePath(campaignsPath, campaignId),
      label: campaignLabel,
      adAccountId: resolveAdAccountId(input, context),
    });
    return { id: campaignId, deleted: true };
  },

  async get_campaign_limited_status_details(input, context) {
    const result = await getAppleAdsResource(context, {
      path: resourcePath(
        campaignsPath,
        readAppleAdsId(input.campaignId, "campaignId"),
        "legacy-app-limited-status-reason-details",
      ),
      label: "Apple Ads campaign limited status details",
      adAccountId: resolveAdAccountId(input, context),
    });
    const reasons = optionalRecord(result.countryOrRegionLimitedStatusReasons);
    return {
      countryOrRegionLimitedStatusReasons: reasons ?? null,
    };
  },
};

function readSharedBudgets(value: unknown): Array<{ budgetId: number }> | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value.map((item) => ({
    budgetId: readAppleAdsNumericId(recordOrEmpty(item).budgetId, "sharedBudgets[].budgetId"),
  }));
}
