import type { ActionDefinition } from "../../core/types.ts";

import { karakeepAdminActions } from "./actions-admin.ts";
import { karakeepAssetActions } from "./actions-assets.ts";
import { karakeepBackupActions } from "./actions-backups.ts";
import { karakeepBookmarkActions } from "./actions-bookmarks.ts";
import { karakeepFeedActions } from "./actions-feeds.ts";
import { karakeepHighlightActions } from "./actions-highlights.ts";
import { karakeepListActions } from "./actions-lists.ts";
import { karakeepTagActions } from "./actions-tags.ts";
import { karakeepUserActions } from "./actions-users.ts";

export const karakeepActions: readonly ActionDefinition[] = [
  ...karakeepUserActions,
  ...karakeepBookmarkActions,
  ...karakeepListActions,
  ...karakeepTagActions,
  ...karakeepHighlightActions,
  ...karakeepAssetActions,
  ...karakeepBackupActions,
  ...karakeepFeedActions,
  ...karakeepAdminActions,
];
