import type { CredentialValidationResult } from "../../core/types.ts";
import type { AppleAdsCredential } from "./auth.ts";
import type { AppleAdsContext, AppleAdsHandlers } from "./runtime-helpers.ts";

import { looseArray, pickOptionalString, recordOrEmpty } from "../../core/cast.ts";
import { ProviderRequestError, requiredResponseRecord } from "../provider-runtime.ts";
import { requestAppleAdsAccessToken } from "./auth.ts";
import { appleAdsAccountHandlers } from "./runtime-account.ts";
import { appleAdsAdGroupHandlers } from "./runtime-adgroups.ts";
import { appleAdsAdHandlers } from "./runtime-ads.ts";
import { appleAdsAppHandlers } from "./runtime-apps.ts";
import { appleAdsAssetHandlers } from "./runtime-assets.ts";
import { appleAdsBrandHandlers } from "./runtime-brands.ts";
import { appleAdsBudgetOrderHandlers } from "./runtime-budget-orders.ts";
import { appleAdsCampaignHandlers } from "./runtime-campaigns.ts";
import { appleAdsChangeHistoryHandlers } from "./runtime-change-history.ts";
import { appleAdsGeoHandlers } from "./runtime-geo.ts";
import { appleAdsApiOrigin, asIdentifierText, readAppleAdsId, readResult, requestAppleAds } from "./runtime-helpers.ts";
import { appleAdsInsightHandlers } from "./runtime-insights.ts";
import { appleAdsKeywordHandlers } from "./runtime-keywords.ts";
import { appleAdsNegativeKeywordHandlers } from "./runtime-negative-keywords.ts";
import { appleAdsReportHandlers } from "./runtime-reports.ts";

const meEndpoint = "/v1/me";
const aclEndpoint = "/v1/acls";
export const appleAdsActionHandlers: AppleAdsHandlers = {
  ...appleAdsAccountHandlers,
  ...appleAdsAppHandlers,
  ...appleAdsCampaignHandlers,
  ...appleAdsAdGroupHandlers,
  ...appleAdsKeywordHandlers,
  ...appleAdsNegativeKeywordHandlers,
  ...appleAdsAdHandlers,
  ...appleAdsAssetHandlers,
  ...appleAdsGeoHandlers,
  ...appleAdsBrandHandlers,
  ...appleAdsBudgetOrderHandlers,
  ...appleAdsReportHandlers,
  ...appleAdsInsightHandlers,
  ...appleAdsChangeHistoryHandlers,
};

export async function validateAppleAdsCredential(
  credential: AppleAdsCredential,
  fetcher: typeof fetch,
  signal?: AbortSignal,
): Promise<CredentialValidationResult> {
  const token = await requestAppleAdsAccessToken(credential, fetcher, "validate", signal);
  const context: AppleAdsContext = {
    authorization: async () => `Bearer ${token.accessToken}`,
    fetcher,
    signal,
  };

  const { payload: mePayload } = await requestAppleAds(context, {
    path: meEndpoint,
    phase: "validate",
  });
  const me = readResult(mePayload, "Apple Ads me");
  const orgId = asIdentifierText(me.orgId);
  const userId = asIdentifierText(me.userId);

  const { payload: aclPayload } = await requestAppleAds(context, {
    path: aclEndpoint,
    phase: "validate",
  });
  const acls = looseArray(readResult(aclPayload, "Apple Ads user ACL").acls).map((item) =>
    requiredResponseRecord(item, "Apple Ads user ACL item"),
  );
  const selected = selectAdAccount(acls, credential.adAccountId);

  return {
    profile: {
      accountId: `apple_ads:${orgId ?? "unknown"}${credential.adAccountId ? `:${credential.adAccountId}` : ""}`,
      displayName: readAccountLabel(selected, credential.adAccountId, orgId),
    },
    grantedScopes: token.scope ? [token.scope] : [],
    metadata: {
      apiBaseUrl: appleAdsApiOrigin,
      validationEndpoint: meEndpoint,
      userId,
      orgId,
      adAccountId: credential.adAccountId ?? null,
      adAccountRoles: selected ? readRoles(selected) : [],
      accessibleAdAccountCount: acls.length,
    },
  };
}

function selectAdAccount(
  acls: Array<Record<string, unknown>>,
  adAccountId: string | undefined,
): Record<string, unknown> | undefined {
  if (adAccountId === undefined) {
    return undefined;
  }
  const wanted = readAppleAdsId(adAccountId, "adAccountId");
  const match = acls.find((acl) => asIdentifierText(recordOrEmpty(acl.adAccount).id) === wanted);
  if (!match) {
    throw new ProviderRequestError(
      400,
      `The API user cannot access ad account ${wanted}. Leave Ad Account ID empty, or use an ad account returned by GET /v1/acls.`,
    );
  }

  return match;
}

function readAccountLabel(
  selected: Record<string, unknown> | undefined,
  adAccountId: string | undefined,
  orgId: string | null,
): string {
  if (selected) {
    const name = pickOptionalString(recordOrEmpty(selected.adAccount), "name");
    return name ?? `Apple Ads ad account ${adAccountId}`;
  }

  return orgId ? `Apple Ads org ${orgId}` : "Apple Ads Account";
}

function readRoles(acl: Record<string, unknown>): string[] {
  const roles: string[] = [];
  for (const role of Array.isArray(acl.roles) ? acl.roles : []) {
    if (typeof role === "string" && role.trim()) {
      roles.push(role);
    }
  }

  return roles;
}
