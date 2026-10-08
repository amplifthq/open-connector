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
const budgetOrdersPath = "/v1/shared-budgets";
const budgetOrderLabel = "Apple Ads budget order";

export const appleAdsBudgetOrderHandlers: AppleAdsHandlers = {
  async query_budget_orders(input, context) {
    const page = await queryAppleAds(context, input, {
      path: `${budgetOrdersPath}/query`,
      label: budgetOrderLabel,
      adAccountId: resolveAdAccountId(input, context),
    });
    return { budgetOrders: page.items, pagination: page.pagination };
  },

  async get_budget_order(input, context) {
    return {
      budgetOrder: await getAppleAdsResource(context, {
        path: resourcePath(budgetOrdersPath, readAppleAdsId(input.budgetOrderId, "budgetOrderId")),
        label: budgetOrderLabel,
        adAccountId: resolveAdAccountId(input, context),
      }),
    };
  },

  async create_budget_order(input, context) {
    const adAccountId = resolveAdAccountId(input, context);
    return {
      budgetOrder: await createAppleAdsResource(context, {
        path: budgetOrdersPath,
        label: budgetOrderLabel,
        adAccountId,
        body: compactObject({
          name: input.name,
          startTime: input.startTime,
          endTime: input.endTime,
          value: input.value,
          adAccountIds: [readAppleAdsNumericId(adAccountId, "adAccountId")],
          invoiceDetail: input.invoiceDetail,
        }),
      }),
    };
  },

  async update_budget_order(input, context) {
    const body = compactObject({
      name: input.name,
      startTime: input.startTime,
      endTime: input.endTime,
      value: input.value,
      adAccountIds: readAdAccountIds(input.adAccountIds),
      invoiceDetail: input.invoiceDetail,
    });
    requireAnyAttribute(body, "update_budget_order requires at least one field to change besides budgetOrderId");

    return {
      budgetOrder: await updateAppleAdsResource(context, {
        path: resourcePath(budgetOrdersPath, readAppleAdsId(input.budgetOrderId, "budgetOrderId")),
        label: budgetOrderLabel,
        adAccountId: resolveAdAccountId(input, context),
        body,
      }),
    };
  },

  async delete_budget_order(input, context) {
    const budgetOrderId = readAppleAdsId(input.budgetOrderId, "budgetOrderId");
    await deleteAppleAdsResource(context, {
      path: resourcePath(budgetOrdersPath, budgetOrderId),
      label: budgetOrderLabel,
      adAccountId: resolveAdAccountId(input, context),
    });
    return { id: budgetOrderId, deleted: true };
  },
};

function readAdAccountIds(value: unknown): number[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value.map((item) => readAppleAdsNumericId(item, "adAccountIds[]"));
}
