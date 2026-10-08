import type { AppStoreServerHandlers } from "./runtime-helpers.ts";

import { looseArray, optionalBoolean, pickOptionalString, rawStringOrNull, recordOrEmpty } from "../../core/cast.ts";
import { ProviderRequestError, requiredInputNumber } from "../provider-runtime.ts";
import { decodeOptionalNotificationPayload } from "./jws.ts";
import {
  appStoreServerPath,
  getAppStoreServerObject,
  readAppStoreServerId,
  readResponseBoolean,
} from "./runtime-helpers.ts";

export const appStoreServerNotificationHandlers: AppStoreServerHandlers = {
  async request_test_notification(_input, context) {
    const envelope = await getAppStoreServerObject(context, {
      method: "POST",
      path: "/inApps/v1/notifications/test",
    });

    return { testNotificationToken: rawStringOrNull(envelope.testNotificationToken) };
  },

  async get_test_notification_status(input, context) {
    const envelope = await getAppStoreServerObject(context, {
      path: appStoreServerPath(
        "/inApps/v1/notifications/test",
        readAppStoreServerId(input.testNotificationToken, "testNotificationToken"),
      ),
    });

    return readNotificationRecord(envelope);
  },

  async get_notification_history(input, context) {
    const notificationType = pickOptionalString(input, "notificationType");
    const notificationSubtype = pickOptionalString(input, "notificationSubtype");
    const transactionId = pickOptionalString(input, "transactionId");
    if (notificationType && transactionId) {
      throw new ProviderRequestError(
        400,
        "notificationType and transactionId cannot be combined; filter by one of them",
        undefined,
        "invalid_input",
      );
    }
    if (notificationSubtype && !notificationType) {
      throw new ProviderRequestError(400, "notificationSubtype requires notificationType", undefined, "invalid_input");
    }

    const envelope = await getAppStoreServerObject(context, {
      method: "POST",
      path: "/inApps/v1/notifications/history",
      query: { paginationToken: pickOptionalString(input, "paginationToken") },
      body: {
        startDate: requiredInputNumber(input.startDate, "startDate"),
        endDate: requiredInputNumber(input.endDate, "endDate"),
        notificationType,
        notificationSubtype,
        transactionId: transactionId ? readAppStoreServerId(transactionId, "transactionId") : undefined,
        onlyFailures: optionalBoolean(input.onlyFailures),
      },
    });

    return {
      notifications: looseArray(envelope.notificationHistory).map((item) =>
        readNotificationRecord(recordOrEmpty(item)),
      ),
      paginationToken: rawStringOrNull(envelope.paginationToken),
      hasMore: readResponseBoolean(envelope.hasMore),
    };
  },
};

function readNotificationRecord(record: Record<string, unknown>): Record<string, unknown> {
  return {
    notification: decodeOptionalNotificationPayload(record.signedPayload, "notification"),
    sendAttempts: looseArray(record.sendAttempts).map((attempt) => recordOrEmpty(attempt)),
  };
}
