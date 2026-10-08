import type { KarakeepHandlerMap } from "./runtime-helpers.ts";

import { optionalString } from "../../core/cast.ts";
import {
  providerInputError,
  providerResponseError,
  requiredInputString,
  requiredResponseRecord,
} from "../provider-runtime.ts";
import { storeKarakeepResponse } from "./runtime-assets.ts";
import { encodeKarakeepId } from "./runtime-helpers.ts";

const fileTransferTimeoutMs = 120_000;

export const karakeepBackupActionHandlers: KarakeepHandlerMap = {
  async list_backups(_input, context) {
    return requiredResponseRecord(await context.request({ path: "/backups" }), "the backup list");
  },
  async create_backup(_input, context) {
    return requiredResponseRecord(await context.request({ method: "POST", path: "/backups" }), "the created backup");
  },
  async get_backup(input, context) {
    const backupId = encodeKarakeepId(input.backupId, "backupId");
    return requiredResponseRecord(await context.request({ path: `/backups/${backupId}` }), "the backup");
  },
  async delete_backup(input, context) {
    const backupId = requiredInputString(input.backupId, "backupId");
    await context.request({
      method: "DELETE",
      path: `/backups/${encodeKarakeepId(backupId, "backupId")}`,
      expectJson: false,
    });
    return { success: true, backupId };
  },
  async download_backup(input, context) {
    if (!context.transitFiles) {
      throw providerInputError("Karakeep file actions require local transit file storage");
    }
    const backupId = requiredInputString(input.backupId, "backupId");
    const backup = requiredResponseRecord(
      await context.request({ path: `/backups/${encodeKarakeepId(backupId, "backupId")}` }),
      "the backup",
    );
    const status = optionalString(backup.status) ?? "unknown";
    const assetId = optionalString(backup.assetId);
    if (status === "failure") {
      const reason = optionalString(backup.errorMessage);
      throw providerInputError(`Karakeep backup ${backupId} failed${reason ? `: ${reason}` : ""}`);
    }
    if (status !== "success") {
      throw providerInputError(`Karakeep backup ${backupId} is not ready; current status is ${status}`);
    }
    if (!assetId) {
      throw providerResponseError(`Karakeep backup ${backupId} succeeded without an asset id`);
    }
    const file = await context.requestRaw(
      {
        path: `/assets/${encodeKarakeepId(assetId, "assetId")}`,
        timeoutMs: fileTransferTimeoutMs,
      },
      (response) => storeKarakeepResponse(context, response, `karakeep-backup-${backupId}.zip`, "application/zip"),
    );
    return { ...file, backupId, assetId };
  },
};
