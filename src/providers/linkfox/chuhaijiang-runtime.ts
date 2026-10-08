import { optionalNumber, optionalString, rawStringOrNull } from "../../core/cast.ts";
import { readBoundedResponseBytes } from "../../core/request.ts";
import {
  createProviderFetch,
  ProviderRequestError,
  requiredInputString,
  requiredResponseRecord,
  runProviderRequest,
} from "../provider-runtime.ts";

type LinkfoxRequest = (path: string, body: Record<string, unknown>) => Promise<unknown>;

export function normalizeChuhaijiang(payload: unknown): unknown {
  const envelope = requiredResponseRecord(payload, "LinkFox Chuhaijiang response");
  return {
    data: requiredResponseRecord(envelope.data, "LinkFox Chuhaijiang data"),
    requestId: rawStringOrNull(envelope.request_id),
    costToken: optionalNumber(envelope.costToken) ?? null,
  };
}

export async function searchChuhaijiangImage(
  input: Record<string, unknown>,
  request: LinkfoxRequest,
  fetcher: typeof fetch,
): Promise<unknown> {
  let osKey = optionalString(input.osKey);
  if (!osKey) {
    const imageUrl = requiredInputString(input.imageUrl, "imageUrl");
    const guardedFetch = createProviderFetch({ fetch: fetcher });
    const image = await runProviderRequest({ label: "LinkFox image download" }, async (signal) => {
      const response = await guardedFetch(imageUrl, { signal });
      if (!response.ok) throw new ProviderRequestError(400, `imageUrl returned HTTP ${response.status}`);
      const bytes = await readBoundedResponseBytes(response, {
        maxBytes: 10 * 1024 * 1024,
        fieldName: "imageUrl",
        createError: (message) => new ProviderRequestError(413, message),
      });
      const isPng = [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value);
      const isJpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
      if (!isPng && !isJpeg) throw new ProviderRequestError(400, "imageUrl must return a JPG or PNG image");
      return { bytes, mimeType: isPng ? "image/png" : "image/jpeg", fileName: isPng ? "image.png" : "image.jpg" };
    });
    const upload = requiredResponseRecord(
      requiredResponseRecord(
        await request("/chuhaijiang/upload/presigned-url", { fileName: image.fileName }),
        "LinkFox upload",
      ).data,
      "LinkFox upload data",
    );
    const uploadUrl = optionalString(upload.url);
    osKey = optionalString(upload.os_key);
    if (!uploadUrl || !osKey)
      throw new ProviderRequestError(502, "LinkFox image upload response omitted url or os_key");
    const guardedUpload = createProviderFetch({ fetch: fetcher });
    await runProviderRequest({ label: "LinkFox image upload" }, async (signal) => {
      const response = await guardedUpload(uploadUrl, {
        method: "PUT",
        headers: { "content-type": image.mimeType },
        body: new Blob([image.bytes.slice()]),
        signal,
      });
      await response.body?.cancel().catch(() => undefined);
      if (![200, 201, 204].includes(response.status)) {
        throw new ProviderRequestError(502, `Image upload failed with HTTP ${response.status}`);
      }
    });
  }
  return normalizeChuhaijiang(await request("/chuhaijiang/products/image-search", { osKey, country: input.country }));
}
