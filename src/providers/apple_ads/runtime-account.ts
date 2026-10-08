import type { AppleAdsHandlers } from "./runtime-helpers.ts";

import { compactObject, looseArray, recordOrEmpty } from "../../core/cast.ts";
import { requiredInputString, requiredResponseRecord } from "../provider-runtime.ts";
import {
  createAppleAdsResource,
  getAppleAdsResource,
  listAppleAdsResources,
  readAppleAdsId,
  requireAnyAttribute,
  resolveAdAccountId,
  resourcePath,
  updateAppleAdsResource,
} from "./runtime-helpers.ts";

const mePath = "/v1/me";
const aclsPath = "/v1/acls";
const orgsPath = "/v1/orgs";
const adAccountsPath = "/v1/ad-accounts";
const advertiserResourcesPath = "/v1/advertiser-resources";
const aclLabel = "Apple Ads user ACL";
const adAccountLabel = "Apple Ads ad account";

export const appleAdsAccountHandlers: AppleAdsHandlers = {
  async get_me(_input, context) {
    return { me: await getAppleAdsResource(context, { path: mePath, label: "Apple Ads me" }) };
  },

  async get_user_acls(_input, context) {
    const result = await getAppleAdsResource(context, { path: aclsPath, label: aclLabel });
    return {
      acls: looseArray(result.acls).map((item) => requiredResponseRecord(item, `${aclLabel} item`)),
    };
  },

  async get_org(input, context) {
    return {
      org: await getAppleAdsResource(context, {
        path: resourcePath(orgsPath, readAppleAdsId(input.orgId, "orgId")),
        label: "Apple Ads org",
      }),
    };
  },

  async get_advertiser_resources(input, context) {
    return {
      advertiserResources: await listAppleAdsResources(context, {
        path: advertiserResourcesPath,
        label: "Apple Ads advertiser resource",
        query: { resourceType: requiredInputString(input.resourceType, "resourceType") },
      }),
    };
  },

  async create_ad_account(input, context) {
    return {
      adAccount: await createAppleAdsResource(context, {
        path: adAccountsPath,
        label: adAccountLabel,
        body: compactObject({
          name: input.name,
          productFeatures: input.productFeatures,
          delegations: readDelegations(input.delegations),
        }),
      }),
    };
  },

  async get_ad_account(input, context) {
    const adAccountId = resolveAdAccountId(input, context);
    return {
      adAccount: await getAppleAdsResource(context, {
        path: resourcePath(adAccountsPath, adAccountId),
        label: adAccountLabel,
        adAccountId,
      }),
    };
  },

  async update_ad_account(input, context) {
    const body = compactObject({
      name: input.name,
      delegations: readDelegations(input.delegations),
    });
    requireAnyAttribute(
      body,
      "update_ad_account requires name or delegations. productFeatures, currency, timezone and paymentModel are fixed at creation.",
    );

    const adAccountId = resolveAdAccountId(input, context);
    return {
      adAccount: await updateAppleAdsResource(context, {
        path: resourcePath(adAccountsPath, adAccountId),
        label: adAccountLabel,
        adAccountId,
        body,
      }),
    };
  },
};

function readDelegations(value: unknown): Array<{ resourceId: string; resourceType: unknown }> | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value.map((item) => {
    const delegation = recordOrEmpty(item);
    return {
      resourceId: readAppleAdsId(delegation.resourceId, "delegations[].resourceId"),
      resourceType: delegation.resourceType,
    };
  });
}
