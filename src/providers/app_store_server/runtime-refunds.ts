import type { AppStoreServerHandlers } from "./runtime-helpers.ts";

import {
  optionalInteger,
  optionalRawString,
  rawStringOrNull,
  pickOptionalString,
  requiredBoolean,
} from "../../core/cast.ts";
import {
  ProviderRequestError,
  providerInputError,
  requiredInputNumber,
  requiredInputString,
} from "../provider-runtime.ts";
import { decodeJwsPayloadList } from "./jws.ts";
import {
  appStoreServerPath,
  getAppStoreServerObject,
  readAppStoreServerId,
  readResponseBoolean,
  writeAppStoreServerNoContent,
} from "./runtime-helpers.ts";

const consumptionStatuses = [202];

export const appStoreServerRefundHandlers: AppStoreServerHandlers = {
  async get_refund_history(input, context) {
    const envelope = await getAppStoreServerObject(context, {
      path: appStoreServerPath("/inApps/v2/refund/lookup", readAppStoreServerId(input.transactionId, "transactionId")),
      query: { revision: pickOptionalString(input, "revision") },
    });

    return {
      transactions: decodeJwsPayloadList(envelope.signedTransactions, "transaction"),
      revision: rawStringOrNull(envelope.revision),
      hasMore: readResponseBoolean(envelope.hasMore),
    };
  },

  async send_consumption_information(input, context) {
    const transactionId = readAppStoreServerId(input.transactionId, "transactionId");
    const customerConsented = requireCustomerConsent(input.customerConsented);
    const deliveryStatus = requiredInputString(input.deliveryStatus, "deliveryStatus");
    const consumptionPercentage = optionalInteger(input.consumptionPercentage);
    if (deliveryStatus !== "DELIVERED" && consumptionPercentage !== undefined && consumptionPercentage !== 0) {
      throw new ProviderRequestError(
        400,
        "consumptionPercentage must be 0 when deliveryStatus is not DELIVERED",
        undefined,
        "invalid_input",
      );
    }

    await writeAppStoreServerNoContent(context, {
      method: "PUT",
      path: appStoreServerPath("/inApps/v2/transactions/consumption", transactionId),
      body: {
        customerConsented,
        deliveryStatus,
        sampleContentProvided: requiredBoolean(
          input.sampleContentProvided,
          "sampleContentProvided",
          providerInputError,
        ),
        consumptionPercentage,
        refundPreference: pickOptionalString(input, "refundPreference"),
      },
      allowedStatuses: consumptionStatuses,
      label: "Send Consumption Information",
    });

    return { transactionId, submitted: true };
  },

  async send_consumption_information_v1(input, context) {
    const transactionId = readAppStoreServerId(input.transactionId, "transactionId");
    await writeAppStoreServerNoContent(context, {
      method: "PUT",
      path: appStoreServerPath("/inApps/v1/transactions/consumption", transactionId),
      body: {
        customerConsented: requireCustomerConsent(input.customerConsented),
        sampleContentProvided: requiredBoolean(
          input.sampleContentProvided,
          "sampleContentProvided",
          providerInputError,
        ),
        appAccountToken: optionalRawString(input.appAccountToken),
        accountTenure: requiredInputNumber(input.accountTenure, "accountTenure"),
        consumptionStatus: requiredInputNumber(input.consumptionStatus, "consumptionStatus"),
        deliveryStatus: requiredInputNumber(input.deliveryStatus, "deliveryStatus"),
        lifetimeDollarsPurchased: requiredInputNumber(input.lifetimeDollarsPurchased, "lifetimeDollarsPurchased"),
        lifetimeDollarsRefunded: requiredInputNumber(input.lifetimeDollarsRefunded, "lifetimeDollarsRefunded"),
        platform: requiredInputNumber(input.platform, "platform"),
        playTime: requiredInputNumber(input.playTime, "playTime"),
        userStatus: requiredInputNumber(input.userStatus, "userStatus"),
        refundPreference: optionalInteger(input.refundPreference),
      },
      allowedStatuses: consumptionStatuses,
      label: "Send Consumption Information V1",
    });

    return { transactionId, submitted: true };
  },
};

function requireCustomerConsent(value: unknown): boolean {
  if (requiredBoolean(value, "customerConsented", providerInputError) !== true) {
    throw new ProviderRequestError(
      400,
      "customerConsented must be true; the App Store rejects consumption information without the customer's consent",
      undefined,
      "invalid_input",
    );
  }

  return true;
}
