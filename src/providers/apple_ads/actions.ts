import type { ProviderActionDefinition } from "../../core/provider-definition.ts";

import { appleAdsAccountActions } from "./actions-account.ts";
import { appleAdsAdGroupActions } from "./actions-adgroups.ts";
import { appleAdsAdActions } from "./actions-ads.ts";
import { appleAdsAppActions } from "./actions-apps.ts";
import { appleAdsAssetActions } from "./actions-assets.ts";
import { appleAdsBrandActions } from "./actions-brands.ts";
import { appleAdsBudgetOrderActions } from "./actions-budget-orders.ts";
import { appleAdsCampaignActions } from "./actions-campaigns.ts";
import { appleAdsChangeHistoryActions } from "./actions-change-history.ts";
import { appleAdsGeoActions } from "./actions-geo.ts";
import { appleAdsInsightActions } from "./actions-insights.ts";
import { appleAdsKeywordActions } from "./actions-keywords.ts";
import { appleAdsNegativeKeywordActions } from "./actions-negative-keywords.ts";
import { appleAdsReportActions } from "./actions-reports.ts";
export const appleAdsActions: readonly ProviderActionDefinition[] = [
  ...appleAdsAccountActions,
  ...appleAdsAppActions,
  ...appleAdsCampaignActions,
  ...appleAdsAdGroupActions,
  ...appleAdsKeywordActions,
  ...appleAdsNegativeKeywordActions,
  ...appleAdsAdActions,
  ...appleAdsAssetActions,
  ...appleAdsGeoActions,
  ...appleAdsBrandActions,
  ...appleAdsBudgetOrderActions,
  ...appleAdsReportActions,
  ...appleAdsInsightActions,
  ...appleAdsChangeHistoryActions,
];
