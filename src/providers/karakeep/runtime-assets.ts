import type { ProviderTransitFile } from "../provider-runtime.ts";
import type { KarakeepExecutionContext, KarakeepHandlerMap } from "./runtime-helpers.ts";

import { optionalString } from "../../core/cast.ts";
import { readBoundedResponseBytes } from "../../core/request.ts";
import {
  providerInputError,
  ProviderRequestError,
  readTransitFileInput,
  requiredInputString,
  requiredResponseRecord,
} from "../provider-runtime.ts";
import { encodeKarakeepId } from "./runtime-helpers.ts";

const fileTransferTimeoutMs = 120_000;

export const karakeepAssetActionHandlers: KarakeepHandlerMap = {
  async upload_asset(input, context) {
    const source = await readTransitFileInput(input.file, context);
    if (source.sizeBytes === 0) {
      throw providerInputError("file must not be empty");
    }
    const mimeType = normalizeKarakeepMimeType(source.mimeType) ?? "application/octet-stream";
    const body = new FormData();
    const file = source.file.type === mimeType ? source.file : new File([source.file], source.name, { type: mimeType });
    body.append("file", file, source.name);
    return requiredResponseRecord(
      await context.requestMultipart({
        method: "POST",
        path: "/assets",
        body,
        timeoutMs: fileTransferTimeoutMs,
      }),
      "the uploaded asset",
    );
  },
  async get_asset(input, context) {
    const assetId = requiredInputString(input.assetId, "assetId");
    requireTransitFiles(context);
    return context.requestRaw(
      {
        path: `/assets/${encodeKarakeepId(assetId, "assetId")}`,
        timeoutMs: fileTransferTimeoutMs,
      },
      (response) => storeKarakeepResponse(context, response, assetFileName(assetId, response)),
    );
  },
  async get_asset_signed_url(input, context) {
    const assetId = encodeKarakeepId(input.assetId, "assetId");
    return requiredResponseRecord(
      await context.request({ path: `/assets/${assetId}/signed-url` }),
      "the signed asset URL",
    );
  },
};

export async function storeKarakeepResponse(
  context: KarakeepExecutionContext,
  response: Response,
  name: string,
  fallbackMimeType = "application/octet-stream",
): Promise<ProviderTransitFile> {
  const transitFiles = requireTransitFiles(context);
  const mimeType = normalizeKarakeepMimeType(response.headers.get("content-type")) ?? fallbackMimeType;
  const bytes = await readBoundedResponseBytes(response, {
    maxBytes: transitFiles.maxBytes,
    fieldName: name,
    createError: (message) => new ProviderRequestError(413, message),
  });
  if (bytes.byteLength === 0) {
    throw new ProviderRequestError(502, "Karakeep returned an empty file");
  }
  const stored = await transitFiles.create(new File([Uint8Array.from(bytes)], name, { type: mimeType }));
  return {
    fileId: stored.fileId,
    downloadUrl: stored.downloadUrl,
    sizeBytes: stored.sizeBytes,
    name: stored.name,
    mimeType: stored.mimeType,
  };
}

function requireTransitFiles(context: KarakeepExecutionContext) {
  if (!context.transitFiles) {
    throw providerInputError("Karakeep file actions require local transit file storage");
  }
  return context.transitFiles;
}

function normalizeKarakeepMimeType(value: string | null | undefined): string | undefined {
  const mimeType = optionalString(value)?.split(";", 1)[0]?.trim().toLowerCase();
  return mimeType || undefined;
}

function assetFileName(assetId: string, response: Response): string {
  const extension = extensionForMimeType(normalizeKarakeepMimeType(response.headers.get("content-type")));
  return `${assetId}${extension}`;
}

function extensionForMimeType(mimeType: string | undefined): string {
  switch (mimeType) {
    case "image/gif":
      return ".gif";
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "video/mp4":
      return ".mp4";
    case "video/webm":
      return ".webm";
    case "video/x-matroska":
      return ".mkv";
    case "text/html":
      return ".html";
    case "application/pdf":
      return ".pdf";
    case "application/zip":
      return ".zip";
    default:
      return "";
  }
}
