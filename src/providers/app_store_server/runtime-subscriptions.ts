import type { AppStoreServerHandlers } from "./runtime-helpers.ts";

import { looseArray, rawStringOrNull, recordOrEmpty } from "../../core/cast.ts";
import { requiredInputNumber, requiredInputString } from "../provider-runtime.ts";
import { decodeOptionalJwsPayload } from "./jws.ts";
import {
  appStoreServerPath,
  getAppStoreServerObject,
  readAppStoreServerId,
  readRepeatedIntegerQuery,
  readResponseBoolean,
  readResponseInteger,
} from "./runtime-helpers.ts";

export const appStoreServerSubscriptionHandlers: AppStoreServerHandlers = {
  async get_all_subscription_statuses(input, context) {
    const envelope = await getAppStoreServerObject(context, {
      path: appStoreServerPath("/inApps/v1/subscriptions", readAppStoreServerId(input.transactionId, "transactionId")),
      query: { status: readRepeatedIntegerQuery(input.statuses, "statuses") },
    });

    return {
      subscriptionGroups: looseArray(envelope.data).map((item) => {
        const group = recordOrEmpty(item);
        return {
          subscriptionGroupIdentifier: rawStringOrNull(group.subscriptionGroupIdentifier),
          lastTransactions: looseArray(group.lastTransactions).map((entry) => {
            const lastTransaction = recordOrEmpty(entry);
            return {
              originalTransactionId: rawStringOrNull(lastTransaction.originalTransactionId),
              status: readResponseInteger(lastTransaction.status),
              transaction: decodeOptionalJwsPayload(lastTransaction.signedTransactionInfo, "transaction"),
              renewalInfo: decodeOptionalJwsPayload(lastTransaction.signedRenewalInfo, "renewal information"),
            };
          }),
        };
      }),
      environment: rawStringOrNull(envelope.environment),
      bundleId: rawStringOrNull(envelope.bundleId),
      appAppleId: readResponseInteger(envelope.appAppleId),
    };
  },

  async extend_subscription_renewal_date(input, context) {
    const envelope = await getAppStoreServerObject(context, {
      method: "PUT",
      path: appStoreServerPath(
        "/inApps/v1/subscriptions/extend",
        readAppStoreServerId(input.originalTransactionId, "originalTransactionId"),
      ),
      body: {
        extendByDays: requiredInputNumber(input.extendByDays, "extendByDays"),
        extendReasonCode: requiredInputNumber(input.extendReasonCode, "extendReasonCode"),
        requestIdentifier: requiredInputString(input.requestIdentifier, "requestIdentifier"),
      },
    });

    return {
      originalTransactionId: rawStringOrNull(envelope.originalTransactionId),
      webOrderLineItemId: rawStringOrNull(envelope.webOrderLineItemId),
      success: readResponseBoolean(envelope.success),
      effectiveDate: readResponseInteger(envelope.effectiveDate),
    };
  },

  async extend_renewal_date_for_all_active_subscribers(input, context) {
    const storefrontCountryCodes = looseArray(input.storefrontCountryCodes).map((code) =>
      requiredInputString(code, "storefrontCountryCodes").toUpperCase(),
    );
    const envelope = await getAppStoreServerObject(context, {
      method: "POST",
      path: "/inApps/v1/subscriptions/extend/mass",
      body: {
        productId: readAppStoreServerId(input.productId, "productId"),
        extendByDays: requiredInputNumber(input.extendByDays, "extendByDays"),
        extendReasonCode: requiredInputNumber(input.extendReasonCode, "extendReasonCode"),
        requestIdentifier: requiredInputString(input.requestIdentifier, "requestIdentifier"),
        ...(storefrontCountryCodes.length > 0 ? { storefrontCountryCodes } : {}),
      },
    });

    return { requestIdentifier: rawStringOrNull(envelope.requestIdentifier) };
  },

  async get_subscription_renewal_date_extension_status(input, context) {
    const envelope = await getAppStoreServerObject(context, {
      path: appStoreServerPath(
        "/inApps/v1/subscriptions/extend/mass",
        readAppStoreServerId(input.productId, "productId"),
        readAppStoreServerId(input.requestIdentifier, "requestIdentifier"),
      ),
    });

    return {
      requestIdentifier: rawStringOrNull(envelope.requestIdentifier),
      complete: readResponseBoolean(envelope.complete),
      completeDate: readResponseInteger(envelope.completeDate),
      succeededCount: readResponseInteger(envelope.succeededCount),
      failedCount: readResponseInteger(envelope.failedCount),
    };
  },
};
