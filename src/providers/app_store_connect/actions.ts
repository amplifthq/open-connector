import type { ProviderActionDefinition } from "../../core/provider-definition.ts";

import { appStoreConnectAccessAnalyticsActions } from "./actions-access-analytics.ts";
import { appStoreConnectAppEventClipActions } from "./actions-app-events-clips.ts";
import { appStoreConnectAppInfoActions } from "./actions-app-info.ts";
import { appStoreConnectAppStoreVersionActions } from "./actions-app-store-versions.ts";
import { appStoreConnectAppsBuildsActions } from "./actions-apps-builds.ts";
import { appStoreConnectCustomerReviewActions } from "./actions-customer-reviews.ts";
import { appStoreConnectDistributionActions } from "./actions-distribution.ts";
import { appStoreConnectGameCenterActivityActions } from "./actions-game-center-activities.ts";
import { appStoreConnectGameCenterActions } from "./actions-game-center.ts";
import { appStoreConnectInAppPurchaseActions } from "./actions-iap.ts";
import { appStoreConnectPricingActions } from "./actions-pricing.ts";
import { appStoreConnectProductPageActions } from "./actions-product-pages.ts";
import { appStoreConnectReleaseActions } from "./actions-release.ts";
import { appStoreConnectSigningActions } from "./actions-signing.ts";
import { appStoreConnectSubscriptionOfferActions } from "./actions-subscription-offers.ts";
import { appStoreConnectSubscriptionActions } from "./actions-subscriptions.ts";
import { appStoreConnectTestFlightBuildActions } from "./actions-testflight-builds.ts";
import { appStoreConnectTestFlightFeedbackActions } from "./actions-testflight-feedback.ts";
import { appStoreConnectTestFlightActions } from "./actions-testflight.ts";
import { appStoreConnectUserActions } from "./actions-users.ts";
import { appStoreConnectWebhookActions } from "./actions-webhooks.ts";
import { appStoreConnectXcodeCloudActions } from "./actions-xcode-cloud.ts";

export const appStoreConnectActions: readonly ProviderActionDefinition[] = [
  ...appStoreConnectAppsBuildsActions,
  ...appStoreConnectTestFlightActions,
  ...appStoreConnectAppStoreVersionActions,
  ...appStoreConnectCustomerReviewActions,
  ...appStoreConnectUserActions,
  ...appStoreConnectPricingActions,
  ...appStoreConnectWebhookActions,
  ...appStoreConnectSigningActions,
  ...appStoreConnectTestFlightBuildActions,
  ...appStoreConnectReleaseActions,
  ...appStoreConnectAppInfoActions,
  ...appStoreConnectXcodeCloudActions,
  ...appStoreConnectTestFlightFeedbackActions,
  ...appStoreConnectSubscriptionOfferActions,
  ...appStoreConnectAccessAnalyticsActions,
  ...appStoreConnectSubscriptionActions,
  ...appStoreConnectInAppPurchaseActions,
  ...appStoreConnectProductPageActions,
  ...appStoreConnectDistributionActions,
  ...appStoreConnectAppEventClipActions,
  ...appStoreConnectGameCenterActions,
  ...appStoreConnectGameCenterActivityActions,
];
