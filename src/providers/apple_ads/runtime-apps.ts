import type { AppleAdsHandlers } from "./runtime-helpers.ts";

import { booleanString, looseArray, optionalInteger, optionalString } from "../../core/cast.ts";
import {
  getAppleAdsResource,
  queryAppleAds,
  readAppleAdsId,
  readPagination,
  readResultCollection,
  requestAppleAds,
  requireAnyAttribute,
  resolveAdAccountId,
  resourcePath,
} from "./runtime-helpers.ts";

const searchAppsPath = "/v1/search/apps";
const appsPath = "/v1/apps";
const supportedLanguagesPath = "/v1/metadata/apps/supported-languages/query";
const eligibilitiesPath = "/v1/eligibilities/apps/query";
const rejectionReasonsPath = "/v1/rejection-reasons/apps";

const appSearchLabel = "Apple Ads app search";
const appLabel = "Apple Ads app";
const supportedLanguagesLabel = "Apple Ads supported app languages";
const eligibilityLabel = "Apple Ads app eligibility";
const rejectionReasonLabel = "Apple Ads app rejection reason";

export const appleAdsAppHandlers: AppleAdsHandlers = {
  async search_apps(input, context) {
    const query = optionalString(input.query);
    const cpids = readCpids(input.cpids);
    const returnOwnedApps = booleanString(input.returnOwnedApps);
    requireAnyAttribute(
      { query, cpids, returnOwnedApps: returnOwnedApps === "true" ? returnOwnedApps : undefined },
      "search_apps requires at least one of query, cpids or returnOwnedApps set to true",
    );

    const { payload } = await requestAppleAds(context, {
      path: withStoreFronts(searchAppsPath, input.storeFronts),
      query: {
        query,
        cpids,
        returnOwnedApps,
        offset: readOptionalCount(input.offset),
        limit: readOptionalCount(input.limit),
      },
      adAccountId: resolveAdAccountId(input, context),
    });

    return {
      apps: readResultCollection(payload, appSearchLabel),
      pagination: readPagination(payload),
    };
  },

  async get_app(input, context) {
    return {
      app: await getAppleAdsResource(context, {
        path: resourcePath(appsPath, readAppleAdsId(input.adamId, "adamId")),
        label: appLabel,
        adAccountId: resolveAdAccountId(input, context),
      }),
    };
  },

  async query_supported_app_languages(input, context) {
    const page = await queryAppleAds(context, input, {
      path: supportedLanguagesPath,
      label: supportedLanguagesLabel,
      adAccountId: resolveAdAccountId(input, context),
    });
    return { markets: page.items, pagination: page.pagination };
  },

  async query_app_eligibilities(input, context) {
    const page = await queryAppleAds(context, input, {
      path: eligibilitiesPath,
      label: eligibilityLabel,
      adAccountId: resolveAdAccountId(input, context),
    });
    return { eligibilities: page.items, pagination: page.pagination };
  },

  async query_app_rejection_reasons(input, context) {
    const page = await queryAppleAds(context, input, {
      path: `${rejectionReasonsPath}/query`,
      label: rejectionReasonLabel,
      adAccountId: resolveAdAccountId(input, context),
    });
    return { rejectionReasons: page.items, pagination: page.pagination };
  },

  async get_app_rejection_reasons(input, context) {
    return {
      rejectionReason: await getAppleAdsResource(context, {
        path: resourcePath(rejectionReasonsPath, readAppleAdsId(input.rejectionReasonId, "rejectionReasonId")),
        label: rejectionReasonLabel,
        adAccountId: resolveAdAccountId(input, context),
      }),
    };
  },
};

function readCpids(value: unknown): string | undefined {
  const cpids = looseArray(value).map((cpid) => String(cpid));
  return cpids.length > 0 ? cpids.join(",") : undefined;
}

function withStoreFronts(path: string, value: unknown): string {
  const search = new URLSearchParams();
  for (const code of looseArray(value)) {
    search.append("storeFronts", String(code));
  }
  const encoded = search.toString();

  return encoded ? `${path}?${encoded}` : path;
}

function readOptionalCount(value: unknown): string | undefined {
  const count = optionalInteger(value);
  return count === undefined ? undefined : String(count);
}
