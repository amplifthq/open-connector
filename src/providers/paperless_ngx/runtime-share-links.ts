import type { PaperlessExecutionContext, PaperlessHandlerMap } from "./runtime-helpers.ts";

import { optionalRecord, optionalString } from "../../core/cast.ts";
import { requiredResponseRecord } from "../provider-runtime.ts";
import {
  buildPaperlessListQuery,
  deletedResult,
  encodePaperlessId,
  normalizePaperlessPage,
  pickProvidedFields,
} from "./runtime-helpers.ts";

const shareLinksPath = "/api/share_links/";
const shareLinkBundlesPath = "/api/share_link_bundles/";

function withShareUrl(context: PaperlessExecutionContext, item: Record<string, unknown>): Record<string, unknown> {
  const slug = optionalString(item.slug)?.trim();
  if (!slug) return item;
  return { ...item, share_url: `${context.baseUrl}/share/${encodeURIComponent(slug)}` };
}

async function listWithShareUrl(
  context: PaperlessExecutionContext,
  path: string,
  input: Record<string, unknown>,
  label: string,
) {
  const page = normalizePaperlessPage(await context.request({ path, query: buildPaperlessListQuery(input) }), label);
  const results = Array.isArray(page.results) ? page.results : [];
  return {
    ...page,
    results: results.map((item) => {
      const record = optionalRecord(item);
      return record ? withShareUrl(context, record) : item;
    }),
  };
}

async function getWithShareUrl(
  context: PaperlessExecutionContext,
  path: string,
  input: Record<string, unknown>,
  label: string,
) {
  const id = encodePaperlessId(input.id, "id");
  return withShareUrl(context, requiredResponseRecord(await context.request({ path: `${path}${id}/` }), label));
}

async function deleteById(context: PaperlessExecutionContext, path: string, input: Record<string, unknown>) {
  const id = encodePaperlessId(input.id, "id");
  await context.request({ method: "DELETE", path: `${path}${id}/`, expectJson: false });
  return deletedResult({ id: Number(id) });
}

export const paperlessNgxShareLinkActionHandlers: PaperlessHandlerMap = {
  list_share_links: (context, input) =>
    listWithShareUrl(context, shareLinksPath, input, "Paperless-ngx share link list response"),

  get_share_link: (context, input) =>
    getWithShareUrl(context, shareLinksPath, input, "Paperless-ngx share link response"),

  async create_share_link(context, input) {
    return withShareUrl(
      context,
      requiredResponseRecord(
        await context.request({
          method: "POST",
          path: shareLinksPath,
          body: pickProvidedFields(input, ["document", "file_version", "expiration"]),
        }),
        "Paperless-ngx share link create response",
      ),
    );
  },

  delete_share_link: (context, input) => deleteById(context, shareLinksPath, input),

  list_share_link_bundles: (context, input) =>
    listWithShareUrl(context, shareLinkBundlesPath, input, "Paperless-ngx share link bundle list response"),

  get_share_link_bundle: (context, input) =>
    getWithShareUrl(context, shareLinkBundlesPath, input, "Paperless-ngx share link bundle response"),

  async create_share_link_bundle(context, input) {
    return withShareUrl(
      context,
      requiredResponseRecord(
        await context.request({
          method: "POST",
          path: shareLinkBundlesPath,
          body: pickProvidedFields(input, ["document_ids", "file_version", "expiration_days"]),
        }),
        "Paperless-ngx share link bundle create response",
      ),
    );
  },

  async rebuild_share_link_bundle(context, input) {
    const id = encodePaperlessId(input.id, "id");
    return withShareUrl(
      context,
      requiredResponseRecord(
        await context.request({ method: "POST", path: `${shareLinkBundlesPath}${id}/rebuild/` }),
        "Paperless-ngx share link bundle rebuild response",
      ),
    );
  },

  delete_share_link_bundle: (context, input) => deleteById(context, shareLinkBundlesPath, input),
};
