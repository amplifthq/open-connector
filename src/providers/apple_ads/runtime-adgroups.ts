import type { AppleAdsHandlers } from "./runtime-helpers.ts";

import { compactObject } from "../../core/cast.ts";
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

const adGroupsPath = "/v1/adgroups";
const adGroupLabel = "Apple Ads ad group";

export const appleAdsAdGroupHandlers: AppleAdsHandlers = {
  async query_ad_groups(input, context) {
    const page = await queryAppleAds(context, input, {
      path: `${adGroupsPath}/query`,
      label: adGroupLabel,
      adAccountId: resolveAdAccountId(input, context),
    });
    return { adGroups: page.items, pagination: page.pagination };
  },

  async get_ad_group(input, context) {
    return {
      adGroup: await getAppleAdsResource(context, {
        path: resourcePath(adGroupsPath, readAppleAdsId(input.adGroupId, "adGroupId")),
        label: adGroupLabel,
        adAccountId: resolveAdAccountId(input, context),
      }),
    };
  },

  async create_ad_group(input, context) {
    return {
      adGroup: await createAppleAdsResource(context, {
        path: adGroupsPath,
        label: adGroupLabel,
        adAccountId: resolveAdAccountId(input, context),
        body: compactObject({
          campaignId: readAppleAdsNumericId(input.campaignId, "campaignId"),
          name: input.name,
          pricingModel: input.pricingModel,
          startTime: input.startTime,
          endTime: input.endTime,
          status: input.status,
          automatedKeywordsOptIn: input.automatedKeywordsOptIn,
          automatedKeywordsRequired: input.automatedKeywordsRequired,
          bidStrategy: input.bidStrategy,
          targeting: input.targeting,
          cpaCap: input.cpaCap,
        }),
      }),
    };
  },

  async update_ad_group(input, context) {
    const body = compactObject({
      name: input.name,
      status: input.status,
      startTime: input.startTime,
      endTime: input.endTime,
      automatedKeywordsOptIn: input.automatedKeywordsOptIn,
      bidStrategy: input.bidStrategy,
      targeting: input.targeting,
      cpaCap: input.cpaCap,
    });
    requireAnyAttribute(body, "update_ad_group requires at least one field to change besides adGroupId");

    return {
      adGroup: await updateAppleAdsResource(context, {
        path: resourcePath(adGroupsPath, readAppleAdsId(input.adGroupId, "adGroupId")),
        label: adGroupLabel,
        adAccountId: resolveAdAccountId(input, context),
        body,
      }),
    };
  },

  async delete_ad_group(input, context) {
    const adGroupId = readAppleAdsId(input.adGroupId, "adGroupId");
    await deleteAppleAdsResource(context, {
      path: resourcePath(adGroupsPath, adGroupId),
      label: adGroupLabel,
      adAccountId: resolveAdAccountId(input, context),
    });
    return { id: adGroupId, deleted: true };
  },
};
