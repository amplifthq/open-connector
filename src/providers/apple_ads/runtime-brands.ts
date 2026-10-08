import type { AppleAdsHandlers } from "./runtime-helpers.ts";

import {
  getAppleAdsResource,
  queryAppleAds,
  readAppleAdsId,
  resolveAdAccountId,
  resourcePath,
} from "./runtime-helpers.ts";

const brandsPath = "/v1/business-brands";
const businessCategoriesPath = "/v1/business-categories";
const brandRejectionReasonsPath = "/v1/rejection-reasons/business-brands";

const brandLabel = "Apple Ads brand";
const businessCategoryLabel = "Apple Ads business category";
const brandRejectionReasonLabel = "Apple Ads brand rejection reason";

export const appleAdsBrandHandlers: AppleAdsHandlers = {
  async query_brands(input, context) {
    const page = await queryAppleAds(context, input, {
      path: `${brandsPath}/query`,
      label: brandLabel,
      adAccountId: resolveAdAccountId(input, context),
    });
    return { brands: page.items, pagination: page.pagination };
  },

  async get_brand(input, context) {
    return {
      brand: await getAppleAdsResource(context, {
        path: resourcePath(brandsPath, readAppleAdsId(input.brandId, "brandId")),
        label: brandLabel,
        adAccountId: resolveAdAccountId(input, context),
      }),
    };
  },

  async query_business_categories(input, context) {
    const page = await queryAppleAds(context, input, {
      path: `${businessCategoriesPath}/query`,
      label: businessCategoryLabel,
      adAccountId: resolveAdAccountId(input, context),
    });
    return { businessCategories: page.items, pagination: page.pagination };
  },

  async get_business_category(input, context) {
    return {
      businessCategory: await getAppleAdsResource(context, {
        path: resourcePath(businessCategoriesPath, readAppleAdsId(input.businessCategoryId, "businessCategoryId")),
        label: businessCategoryLabel,
        adAccountId: resolveAdAccountId(input, context),
      }),
    };
  },

  async query_brand_rejection_reasons(input, context) {
    const page = await queryAppleAds(context, input, {
      path: `${brandRejectionReasonsPath}/query`,
      label: brandRejectionReasonLabel,
      adAccountId: resolveAdAccountId(input, context),
    });
    return { rejectionReasons: page.items, pagination: page.pagination };
  },
};
