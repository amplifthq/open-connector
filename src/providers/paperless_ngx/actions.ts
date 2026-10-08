import type { ProviderActionDefinition } from "../../core/provider-definition.ts";

import { paperlessNgxDocumentOperationActions } from "./actions-document-operations.ts";
import { paperlessNgxDocumentActions } from "./actions-documents.ts";
import { paperlessNgxMailActions } from "./actions-mail.ts";
import { paperlessNgxObjectActions } from "./actions-objects.ts";
import { paperlessNgxShareLinkActions } from "./actions-share-links.ts";
import { paperlessNgxSystemActions } from "./actions-system.ts";
import { paperlessNgxTaskActions } from "./actions-tasks.ts";
import { paperlessNgxUserActions } from "./actions-users.ts";
import { paperlessNgxWorkflowActions } from "./actions-workflows.ts";
export const paperlessNgxActions: ProviderActionDefinition[] = [
  ...paperlessNgxDocumentActions,
  ...paperlessNgxDocumentOperationActions,
  ...paperlessNgxObjectActions,
  ...paperlessNgxWorkflowActions,
  ...paperlessNgxShareLinkActions,
  ...paperlessNgxTaskActions,
  ...paperlessNgxUserActions,
  ...paperlessNgxMailActions,
  ...paperlessNgxSystemActions,
];
