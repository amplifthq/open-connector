import type { ActionDefinition } from "../../core/types.ts";

import { appStoreServerNotificationActions } from "./actions-notifications.ts";
import { appStoreServerRefundActions } from "./actions-refunds.ts";
import { appStoreServerRetentionMessagingActions } from "./actions-retention-messaging.ts";
import { appStoreServerSubscriptionActions } from "./actions-subscriptions.ts";
import { appStoreServerTransactionActions } from "./actions-transactions.ts";

export const appStoreServerActions: ActionDefinition[] = [
  ...appStoreServerTransactionActions,
  ...appStoreServerSubscriptionActions,
  ...appStoreServerRefundActions,
  ...appStoreServerNotificationActions,
  ...appStoreServerRetentionMessagingActions,
];
