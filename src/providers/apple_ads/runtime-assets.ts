import type { AppleAdsHandlers } from "./runtime-helpers.ts";

import { looseArray, recordOrEmpty } from "../../core/cast.ts";
import { ProviderRequestError } from "../provider-runtime.ts";
import {
  deleteAppleAdsResource,
  getAppleAdsResource,
  queryAppleAds,
  readAppleAdsId,
  resolveAdAccountId,
  resourcePath,
} from "./runtime-helpers.ts";

const assetsPath = "/v1/assets";
const productPagesPath = "/v1/product-pages";
const appsPath = "/v1/apps";
const assetLabel = "Apple Ads asset";
const productPageLabel = "Apple Ads product page";
const productPageLocaleDetailsLabel = "Apple Ads product page locale details";
const appLocaleDetailsLabel = "Apple Ads app locale details";

export const appleAdsAssetHandlers: AppleAdsHandlers = {
  async query_assets(input, context) {
    const page = await queryAppleAds(context, input, {
      path: `${assetsPath}/query`,
      label: assetLabel,
      adAccountId: resolveAdAccountId(input, context),
    });
    return { assets: page.items, pagination: page.pagination };
  },

  async get_asset(input, context) {
    return {
      asset: await getAppleAdsResource(context, {
        path: resourcePath(assetsPath, readAppleAdsId(input.assetId, "assetId")),
        label: assetLabel,
        adAccountId: resolveAdAccountId(input, context),
      }),
    };
  },

  async delete_asset(input, context) {
    const assetId = readAppleAdsId(input.assetId, "assetId");
    await deleteAppleAdsResource(context, {
      path: resourcePath(assetsPath, assetId),
      label: assetLabel,
      adAccountId: resolveAdAccountId(input, context),
    });
    return { id: assetId, deleted: true };
  },

  async query_product_pages(input, context) {
    const page = await queryAppleAds(context, input, {
      path: `${productPagesPath}/query`,
      label: productPageLabel,
      adAccountId: resolveAdAccountId(input, context),
    });
    return { productPages: page.items, pagination: page.pagination };
  },

  async get_product_page(input, context) {
    return {
      productPage: await getAppleAdsResource(context, {
        path: resourcePath(productPagesPath, readAppleAdsId(input.productPageId, "productPageId")),
        label: productPageLabel,
        adAccountId: resolveAdAccountId(input, context),
      }),
    };
  },

  async query_product_page_locale_details(input, context) {
    requireProductPageIdFilter(input.filters);
    const page = await queryAppleAds(context, input, {
      path: `${productPagesPath}/locale-details/query`,
      label: productPageLocaleDetailsLabel,
      adAccountId: resolveAdAccountId(input, context),
    });
    return { localeDetails: page.items, pagination: page.pagination };
  },

  async query_app_locale_details(input, context) {
    const page = await queryAppleAds(context, input, {
      path: resourcePath(appsPath, readAppleAdsId(input.adamId, "adamId"), "locale-details/query"),
      label: appLocaleDetailsLabel,
      adAccountId: resolveAdAccountId(input, context),
    });
    return { localeDetails: page.items, pagination: page.pagination };
  },
};

function requireProductPageIdFilter(filters: unknown): void {
  const scoped = looseArray(filters).some((filter) => recordOrEmpty(filter).field === "productPageId");
  if (!scoped) {
    throw new ProviderRequestError(400, "query_product_page_locale_details requires a filter on productPageId");
  }
}
