import type { AppleAdsHandlers } from "./runtime-helpers.ts";

import { compactObject, optionalRecord } from "../../core/cast.ts";
import {
  createAppleAdsResource,
  deleteAppleAdsResource,
  getAppleAdsResource,
  queryAppleAds,
  readAppleAdsId,
  readAppleAdsNumericId,
  readOptionalAppleAdsId,
  requireAnyAttribute,
  resolveAdAccountId,
  resourcePath,
  updateAppleAdsResource,
} from "./runtime-helpers.ts";

const adsPath = "/v1/ads";
const adLabel = "Apple Ads ad";
const creativesPath = "/v1/creatives";
const creativeLabel = "Apple Ads ad creative";

export const appleAdsAdHandlers: AppleAdsHandlers = {
  async query_ads(input, context) {
    const page = await queryAppleAds(context, input, {
      path: `${adsPath}/query`,
      label: adLabel,
      adAccountId: resolveAdAccountId(input, context),
    });
    return { ads: page.items, pagination: page.pagination };
  },

  async get_ad(input, context) {
    return {
      ad: await getAppleAdsResource(context, {
        path: resourcePath(adsPath, readAppleAdsId(input.adId, "adId")),
        label: adLabel,
        adAccountId: resolveAdAccountId(input, context),
      }),
    };
  },

  async create_ad(input, context) {
    return {
      ad: await createAppleAdsResource(context, {
        path: adsPath,
        label: adLabel,
        adAccountId: resolveAdAccountId(input, context),
        body: {
          adGroupId: readAppleAdsNumericId(input.adGroupId, "adGroupId"),
          creativeId: readAppleAdsNumericId(input.creativeId, "creativeId"),
          name: input.name,
          status: input.status,
        },
      }),
    };
  },

  async update_ad(input, context) {
    const body = compactObject({ name: input.name, status: input.status });
    requireAnyAttribute(body, "update_ad requires name or status besides adId");

    return {
      ad: await updateAppleAdsResource(context, {
        path: resourcePath(adsPath, readAppleAdsId(input.adId, "adId")),
        label: adLabel,
        adAccountId: resolveAdAccountId(input, context),
        body,
      }),
    };
  },

  async delete_ad(input, context) {
    const adId = readAppleAdsId(input.adId, "adId");
    await deleteAppleAdsResource(context, {
      path: resourcePath(adsPath, adId),
      label: adLabel,
      adAccountId: resolveAdAccountId(input, context),
    });
    return { id: adId, deleted: true };
  },

  async query_creatives(input, context) {
    const page = await queryAppleAds(context, input, {
      path: `${creativesPath}/query`,
      label: creativeLabel,
      adAccountId: resolveAdAccountId(input, context),
    });
    return { creatives: page.items, pagination: page.pagination };
  },

  async get_creative(input, context) {
    return {
      creative: await getAppleAdsResource(context, {
        path: resourcePath(creativesPath, readAppleAdsId(input.creativeId, "creativeId")),
        label: creativeLabel,
        adAccountId: resolveAdAccountId(input, context),
      }),
    };
  },

  async create_creative(input, context) {
    return {
      creative: await createAppleAdsResource(context, {
        path: creativesPath,
        label: creativeLabel,
        adAccountId: resolveAdAccountId(input, context),
        body: compactObject({
          name: input.name,
          creativeType: input.creativeType,
          creativeSpec: readCreativeSpec(input.creativeSpec),
          destination: readDestination(input.destination),
        }),
      }),
    };
  },

  async update_creative(input, context) {
    const body = compactObject({
      name: input.name,
      creativeSpec: readCreativeSpec(input.creativeSpec),
    });
    requireAnyAttribute(body, "update_creative requires name or creativeSpec besides creativeId");

    return {
      creative: await updateAppleAdsResource(context, {
        path: resourcePath(creativesPath, readAppleAdsId(input.creativeId, "creativeId")),
        label: creativeLabel,
        adAccountId: resolveAdAccountId(input, context),
        body,
      }),
    };
  },

  async delete_creative(input, context) {
    const creativeId = readAppleAdsId(input.creativeId, "creativeId");
    await deleteAppleAdsResource(context, {
      path: resourcePath(creativesPath, creativeId),
      label: creativeLabel,
      adAccountId: resolveAdAccountId(input, context),
    });
    return { id: creativeId, deleted: true };
  },
};

function readCreativeSpec(value: unknown): Record<string, unknown> | undefined {
  const spec = optionalRecord(value);
  if (!spec) {
    return undefined;
  }

  return compactObject({
    brandId: readOptionalAppleAdsId(spec.brandId, "creativeSpec.brandId"),
    creativeSubtype: spec.creativeSubtype,
    creativeAssets: spec.creativeAssets,
    localizedText: spec.localizedText,
    defaultLocale: spec.defaultLocale,
  });
}

function readDestination(value: unknown): Record<string, unknown> | undefined {
  const destination = optionalRecord(value);
  if (!destination) {
    return undefined;
  }
  const parameters = optionalRecord(destination.parameters);

  return compactObject({
    destinationType: destination.destinationType,
    parameters: parameters
      ? compactObject({
          adamId: readOptionalAppleAdsId(parameters.adamId, "destination.parameters.adamId"),
          productPageId: parameters.productPageId,
        })
      : undefined,
  });
}
