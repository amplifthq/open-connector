import type { AppStoreServerHandlers } from "./runtime-helpers.ts";

import { booleanString, pickOptionalString, rawStringOrNull } from "../../core/cast.ts";
import { ProviderRequestError, requiredInputString } from "../provider-runtime.ts";
import { decodeJwsPayload, decodeJwsPayloadList } from "./jws.ts";
import {
  appStoreServerPath,
  getAppStoreServerObject,
  readAppStoreServerId,
  readIntegerQuery,
  readRepeatedQuery,
  readResponseBoolean,
  readResponseInteger,
  writeAppStoreServerNoContent,
} from "./runtime-helpers.ts";

export const appStoreServerTransactionHandlers: AppStoreServerHandlers = {
  async get_transaction_history(input, context) {
    const envelope = await getAppStoreServerObject(context, {
      path: appStoreServerPath("/inApps/v2/history", readAppStoreServerId(input.transactionId, "transactionId")),
      query: {
        revision: pickOptionalString(input, "revision"),
        startDate: readIntegerQuery(input.startDate),
        endDate: readIntegerQuery(input.endDate),
        productId: readRepeatedQuery(input.productIds, "productIds"),
        productType: readRepeatedQuery(input.productTypes, "productTypes"),
        subscriptionGroupIdentifier: readRepeatedQuery(
          input.subscriptionGroupIdentifiers,
          "subscriptionGroupIdentifiers",
        ),
        inAppOwnershipType: pickOptionalString(input, "inAppOwnershipType"),
        revoked: booleanString(input.revoked),
        sort: pickOptionalString(input, "sort"),
      },
    });

    return {
      transactions: decodeJwsPayloadList(envelope.signedTransactions, "transaction"),
      revision: rawStringOrNull(envelope.revision),
      hasMore: readResponseBoolean(envelope.hasMore),
      bundleId: rawStringOrNull(envelope.bundleId),
      appAppleId: readResponseInteger(envelope.appAppleId),
      environment: rawStringOrNull(envelope.environment),
    };
  },

  async get_transaction_info(input, context) {
    const envelope = await getAppStoreServerObject(context, {
      path: appStoreServerPath("/inApps/v1/transactions", readAppStoreServerId(input.transactionId, "transactionId")),
    });

    return { transaction: decodeJwsPayload(envelope.signedTransactionInfo, "transaction") };
  },

  async get_app_transaction_info(input, context) {
    const envelope = await getAppStoreServerObject(context, {
      path: appStoreServerPath(
        "/inApps/v1/transactions/appTransactions",
        readAppStoreServerId(input.transactionId, "transactionId"),
      ),
    });

    return {
      appTransaction: decodeJwsPayload(envelope.signedAppTransactionInfo, "app transaction"),
    };
  },

  async look_up_order_id(input, context) {
    if (context.environment === "sandbox") {
      throw new ProviderRequestError(
        400,
        "look_up_order_id is not available in the sandbox environment; Apple serves Look Up Order ID only in production. Use a connection whose environment is production.",
        undefined,
        "invalid_input",
      );
    }
    const envelope = await getAppStoreServerObject(context, {
      path: appStoreServerPath("/inApps/v1/lookup", readAppStoreServerId(input.orderId, "orderId")),
    });

    return {
      status: readResponseInteger(envelope.status),
      transactions: decodeJwsPayloadList(envelope.signedTransactions, "transaction"),
    };
  },

  async set_app_account_token(input, context) {
    const originalTransactionId = readAppStoreServerId(input.originalTransactionId, "originalTransactionId");
    const appAccountToken = requiredInputString(input.appAccountToken, "appAccountToken");
    await writeAppStoreServerNoContent(context, {
      method: "PUT",
      path: appStoreServerPath("/inApps/v1/transactions", originalTransactionId, "appAccountToken"),
      body: { appAccountToken },
      allowedStatuses: [200],
      label: "Set App Account Token",
    });

    return { originalTransactionId, appAccountToken, updated: true };
  },

  async finish_transaction(input, context) {
    const transactionId = readAppStoreServerId(input.transactionId, "transactionId");
    await writeAppStoreServerNoContent(context, {
      method: "POST",
      path: appStoreServerPath("/inApps/v1/transactions", transactionId, "finish"),
      allowedStatuses: [200],
      label: "Finish Transaction",
    });

    return { transactionId, finished: true };
  },
};
