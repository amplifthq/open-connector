import type { AppStoreConnectContext, AppStoreConnectHandlers } from "./runtime-helpers.ts";

import { appStoreConnectAccessAnalyticsHandlers } from "./runtime-access-analytics.ts";
import { appStoreConnectAppEventClipHandlers } from "./runtime-app-events-clips.ts";
import { appStoreConnectAppInfoHandlers } from "./runtime-app-info.ts";
import { appStoreConnectAppStoreVersionHandlers } from "./runtime-app-store-versions.ts";
import { appStoreConnectAppsBuildsHandlers } from "./runtime-apps-builds.ts";
import { appStoreConnectCustomerReviewHandlers } from "./runtime-customer-reviews.ts";
import { appStoreConnectDistributionHandlers } from "./runtime-distribution.ts";
import { appStoreConnectGameCenterActivityHandlers } from "./runtime-game-center-activities.ts";
import { appStoreConnectGameCenterHandlers } from "./runtime-game-center.ts";
import { requestAppStoreConnect } from "./runtime-helpers.ts";
import { appStoreConnectInAppPurchaseHandlers } from "./runtime-iap.ts";
import { appStoreConnectPricingHandlers } from "./runtime-pricing.ts";
import { appStoreConnectProductPageHandlers } from "./runtime-product-pages.ts";
import { appStoreConnectReleaseHandlers } from "./runtime-release.ts";
import { appStoreConnectSigningHandlers } from "./runtime-signing.ts";
import { appStoreConnectSubscriptionOfferHandlers } from "./runtime-subscription-offers.ts";
import { appStoreConnectSubscriptionHandlers } from "./runtime-subscriptions.ts";
import { appStoreConnectTestFlightBuildHandlers } from "./runtime-testflight-builds.ts";
import { appStoreConnectTestFlightFeedbackHandlers } from "./runtime-testflight-feedback.ts";
import { appStoreConnectTestFlightHandlers } from "./runtime-testflight.ts";
import { appStoreConnectUserHandlers } from "./runtime-users.ts";
import { appStoreConnectWebhookHandlers } from "./runtime-webhooks.ts";
import { appStoreConnectXcodeCloudHandlers } from "./runtime-xcode-cloud.ts";

export { appStoreConnectApiOrigin, requestAppStoreConnect } from "./runtime-helpers.ts";
export type { AppStoreConnectContext, AppStoreConnectHandler } from "./runtime-helpers.ts";

const validationEndpoint = "/v1/apps";

export const appStoreConnectActionHandlers: AppStoreConnectHandlers = {
  ...appStoreConnectAppsBuildsHandlers,
  ...appStoreConnectTestFlightHandlers,
  ...appStoreConnectAppStoreVersionHandlers,
  ...appStoreConnectCustomerReviewHandlers,
  ...appStoreConnectUserHandlers,
  ...appStoreConnectPricingHandlers,
  ...appStoreConnectWebhookHandlers,
  ...appStoreConnectSigningHandlers,
  ...appStoreConnectTestFlightBuildHandlers,
  ...appStoreConnectReleaseHandlers,
  ...appStoreConnectAppInfoHandlers,
  ...appStoreConnectXcodeCloudHandlers,
  ...appStoreConnectTestFlightFeedbackHandlers,
  ...appStoreConnectSubscriptionOfferHandlers,
  ...appStoreConnectAccessAnalyticsHandlers,
  ...appStoreConnectSubscriptionHandlers,
  ...appStoreConnectInAppPurchaseHandlers,
  ...appStoreConnectProductPageHandlers,
  ...appStoreConnectDistributionHandlers,
  ...appStoreConnectAppEventClipHandlers,
  ...appStoreConnectGameCenterHandlers,
  ...appStoreConnectGameCenterActivityHandlers,
};

export async function requestAppStoreConnectCredentialValidation(context: AppStoreConnectContext): Promise<void> {
  await requestAppStoreConnect(context, { path: validationEndpoint, query: { limit: "1" }, phase: "validate" });
}
