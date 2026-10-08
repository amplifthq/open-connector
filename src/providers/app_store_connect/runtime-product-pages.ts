import type { AppStoreConnectContext, AppStoreConnectHandlers } from "./runtime-helpers.ts";

import {
  looseArray,
  rawStringOrNull,
  recordOrEmpty,
  optionalInteger,
  compactObject,
  optionalBoolean,
  booleanString,
  pickOptionalString,
} from "../../core/cast.ts";
import { ProviderRequestError } from "../provider-runtime.ts";
import { requiredInputString } from "../provider-runtime.ts";
import {
  createResource,
  deleteResource,
  getResource,
  listPage,
  listResources,
  normalizeResource,
  readAppStoreConnectId,
  readCommaSeparatedList,
  readOptionalAppStoreConnectId,
  readRelationshipId,
  readResource,
  requestAppStoreConnect,
  requireAnyAttribute,
  resourcePath,
  toManyLinkage,
  toOneLinkage,
  toOptionalOneLinkage,
  updateResource,
} from "./runtime-helpers.ts";

const customProductPageLabel = "App Store Connect custom product page";
const customProductPageVersionLabel = "App Store Connect custom product page version";
const customProductPageLocalizationLabel = "App Store Connect custom product page localization";
const experimentLabel = "App Store Connect product page optimization test";
const treatmentLabel = "App Store Connect product page optimization treatment";
const treatmentLocalizationLabel = "App Store Connect product page optimization treatment localization";
const promotionLabel = "App Store Connect App Store version promotion";

const experimentInclude = { include: "latestControlVersion" };

const inlineVersionId = "${new-appCustomProductPageVersion-id}";
const inlineLocalizationId = (index: number) => `\${new-appCustomProductPageLocalization-${index}-id}`;

export const appStoreConnectProductPageHandlers: AppStoreConnectHandlers = {
  async list_app_custom_product_pages(input, context) {
    const page = await listPage(context, input, {
      path: resourcePath("/v1/apps", readAppStoreConnectId(input.appId, "appId"), "appCustomProductPages"),
      label: customProductPageLabel,
      query: { "filter[visible]": booleanString(input.visible) },
    });
    return { appCustomProductPages: page.items, nextCursor: page.nextCursor, total: page.total };
  },

  async get_app_custom_product_page(input, context) {
    return {
      appCustomProductPage: await getResource(
        context,
        resourcePath(
          "/v1/appCustomProductPages",
          readAppStoreConnectId(input.appCustomProductPageId, "appCustomProductPageId"),
        ),
        customProductPageLabel,
      ),
    };
  },

  async create_app_custom_product_page(input, context) {
    const appId = readAppStoreConnectId(input.appId, "appId");
    const appStoreVersionTemplateId = readOptionalAppStoreConnectId(
      input.appStoreVersionTemplateId,
      "appStoreVersionTemplateId",
    );
    const customProductPageTemplateId = readOptionalAppStoreConnectId(
      input.customProductPageTemplateId,
      "customProductPageTemplateId",
    );

    if (appStoreVersionTemplateId !== undefined && customProductPageTemplateId !== undefined) {
      throw new ProviderRequestError(
        400,
        "appStoreVersionTemplateId and customProductPageTemplateId are mutually exclusive",
      );
    }
    const included = readInlineVersion(input);
    const { payload } = await requestAppStoreConnect(context, {
      method: "POST",
      path: "/v1/appCustomProductPages",
      body: compactObject({
        data: {
          type: "appCustomProductPages",
          attributes: { name: requiredInputString(input.name, "name") },
          relationships: compactObject({
            app: toOneLinkage("apps", appId),
            appStoreVersionTemplate: toOptionalOneLinkage("appStoreVersions", appStoreVersionTemplateId),
            customProductPageTemplate: toOptionalOneLinkage("appCustomProductPages", customProductPageTemplateId),

            appCustomProductPageVersions: included
              ? toManyLinkage("appCustomProductPageVersions", [inlineVersionId])
              : undefined,
          }),
        },
        included,
      }),
    });
    return {
      appCustomProductPage: normalizeResource(readResource(payload, customProductPageLabel), customProductPageLabel),
    };
  },

  async update_app_custom_product_page(input, context) {
    const appCustomProductPageId = readAppStoreConnectId(input.appCustomProductPageId, "appCustomProductPageId");
    const attributes = {
      name: pickOptionalString(input, "name"),
      visible: optionalBoolean(input.visible),
    };
    requireAnyAttribute(attributes, "at least one custom product page field to update is required");
    const appCustomProductPage = await updateResource(context, {
      path: resourcePath("/v1/appCustomProductPages", appCustomProductPageId),
      type: "appCustomProductPages",
      id: appCustomProductPageId,
      label: customProductPageLabel,
      attributes,
    });
    return { appCustomProductPage };
  },

  async delete_app_custom_product_page(input, context) {
    const appCustomProductPageId = readAppStoreConnectId(input.appCustomProductPageId, "appCustomProductPageId");
    await deleteResource(
      context,
      resourcePath("/v1/appCustomProductPages", appCustomProductPageId),
      `Deleting the ${customProductPageLabel}`,
    );
    return { id: appCustomProductPageId, deleted: true };
  },

  async list_app_custom_product_page_versions(input, context) {
    const page = await listPage(context, input, {
      path: resourcePath(
        "/v1/appCustomProductPages",
        readAppStoreConnectId(input.appCustomProductPageId, "appCustomProductPageId"),
        "appCustomProductPageVersions",
      ),
      label: customProductPageVersionLabel,
      query: { "filter[state]": readCommaSeparatedList(input.states) },
    });
    return {
      appCustomProductPageVersions: page.items,
      nextCursor: page.nextCursor,
      total: page.total,
    };
  },

  async get_app_custom_product_page_version(input, context) {
    return {
      appCustomProductPageVersion: await getResource(
        context,
        resourcePath(
          "/v1/appCustomProductPageVersions",
          readAppStoreConnectId(input.appCustomProductPageVersionId, "appCustomProductPageVersionId"),
        ),
        customProductPageVersionLabel,
      ),
    };
  },

  async create_app_custom_product_page_version(input, context) {
    const appCustomProductPageVersion = await createResource(context, {
      path: "/v1/appCustomProductPageVersions",
      type: "appCustomProductPageVersions",
      label: customProductPageVersionLabel,
      attributes: { deepLink: pickOptionalString(input, "deepLink") },
      relationships: {
        appCustomProductPage: toOneLinkage(
          "appCustomProductPages",
          readAppStoreConnectId(input.appCustomProductPageId, "appCustomProductPageId"),
        ),
      },
    });
    return { appCustomProductPageVersion };
  },

  async update_app_custom_product_page_version(input, context) {
    const appCustomProductPageVersionId = readAppStoreConnectId(
      input.appCustomProductPageVersionId,
      "appCustomProductPageVersionId",
    );

    const attributes = { deepLink: rawStringOrNull(input.deepLink) };
    requireAnyAttribute(attributes, "deepLink is required");
    const appCustomProductPageVersion = await updateResource(context, {
      path: resourcePath("/v1/appCustomProductPageVersions", appCustomProductPageVersionId),
      type: "appCustomProductPageVersions",
      id: appCustomProductPageVersionId,
      label: customProductPageVersionLabel,
      attributes,
    });
    return { appCustomProductPageVersion };
  },

  async list_app_custom_product_page_localizations(input, context) {
    const page = await listPage(context, input, {
      path: resourcePath(
        "/v1/appCustomProductPageVersions",
        readAppStoreConnectId(input.appCustomProductPageVersionId, "appCustomProductPageVersionId"),
        "appCustomProductPageLocalizations",
      ),
      label: customProductPageLocalizationLabel,
      query: { "filter[locale]": readCommaSeparatedList(input.locales) },
    });
    return {
      appCustomProductPageLocalizations: page.items,
      nextCursor: page.nextCursor,
      total: page.total,
    };
  },

  async get_app_custom_product_page_localization(input, context) {
    return {
      appCustomProductPageLocalization: await getResource(
        context,
        resourcePath(
          "/v1/appCustomProductPageLocalizations",
          readAppStoreConnectId(input.appCustomProductPageLocalizationId, "appCustomProductPageLocalizationId"),
        ),
        customProductPageLocalizationLabel,
      ),
    };
  },

  async create_app_custom_product_page_localization(input, context) {
    const appCustomProductPageLocalization = await createResource(context, {
      path: "/v1/appCustomProductPageLocalizations",
      type: "appCustomProductPageLocalizations",
      label: customProductPageLocalizationLabel,
      attributes: {
        locale: requiredInputString(input.locale, "locale"),
        promotionalText: pickOptionalString(input, "promotionalText"),
      },
      relationships: {
        appCustomProductPageVersion: toOneLinkage(
          "appCustomProductPageVersions",
          readAppStoreConnectId(input.appCustomProductPageVersionId, "appCustomProductPageVersionId"),
        ),
      },
    });
    return { appCustomProductPageLocalization };
  },

  async update_app_custom_product_page_localization(input, context) {
    const appCustomProductPageLocalizationId = readAppStoreConnectId(
      input.appCustomProductPageLocalizationId,
      "appCustomProductPageLocalizationId",
    );

    const attributes = { promotionalText: rawStringOrNull(input.promotionalText) };
    requireAnyAttribute(attributes, "promotionalText is required");
    const appCustomProductPageLocalization = await updateResource(context, {
      path: resourcePath("/v1/appCustomProductPageLocalizations", appCustomProductPageLocalizationId),
      type: "appCustomProductPageLocalizations",
      id: appCustomProductPageLocalizationId,
      label: customProductPageLocalizationLabel,
      attributes,
    });
    return { appCustomProductPageLocalization };
  },

  async delete_app_custom_product_page_localization(input, context) {
    const appCustomProductPageLocalizationId = readAppStoreConnectId(
      input.appCustomProductPageLocalizationId,
      "appCustomProductPageLocalizationId",
    );
    await deleteResource(
      context,
      resourcePath("/v1/appCustomProductPageLocalizations", appCustomProductPageLocalizationId),
      `Deleting the ${customProductPageLocalizationLabel}`,
    );
    return { id: appCustomProductPageLocalizationId, deleted: true };
  },

  async list_app_store_version_experiments(input, context) {
    const page = await listResources(context, input, {
      path: resourcePath("/v1/apps", readAppStoreConnectId(input.appId, "appId"), "appStoreVersionExperimentsV2"),
      label: `${experimentLabel} list`,
      query: { "filter[state]": readCommaSeparatedList(input.states), ...experimentInclude },
    });
    return {
      appStoreVersionExperiments: page.resources.map((resource) => readExperiment(resource)),
      nextCursor: page.nextCursor,
      total: page.total,
    };
  },

  async get_app_store_version_experiment(input, context) {
    return {
      appStoreVersionExperiment: await fetchExperiment(
        context,
        readAppStoreConnectId(input.appStoreVersionExperimentId, "appStoreVersionExperimentId"),
      ),
    };
  },

  async create_app_store_version_experiment(input, context) {
    const created = await createResource(context, {
      path: "/v2/appStoreVersionExperiments",
      type: "appStoreVersionExperiments",
      label: experimentLabel,
      attributes: {
        name: requiredInputString(input.name, "name"),
        platform: requiredInputString(input.platform, "platform"),
        trafficProportion: requireInputInteger(input.trafficProportion, "trafficProportion"),
      },
      relationships: {
        app: toOneLinkage("apps", readAppStoreConnectId(input.appId, "appId")),
      },
    });

    return { appStoreVersionExperiment: await fetchExperiment(context, String(created.id)) };
  },

  async update_app_store_version_experiment(input, context) {
    const appStoreVersionExperimentId = readAppStoreConnectId(
      input.appStoreVersionExperimentId,
      "appStoreVersionExperimentId",
    );
    const attributes = {
      name: pickOptionalString(input, "name"),
      trafficProportion: optionalInteger(input.trafficProportion),
      started: optionalBoolean(input.started),
    };
    requireAnyAttribute(attributes, "at least one product page optimization test field to update is required");
    await updateResource(context, {
      path: resourcePath("/v2/appStoreVersionExperiments", appStoreVersionExperimentId),
      type: "appStoreVersionExperiments",
      id: appStoreVersionExperimentId,
      label: experimentLabel,
      attributes,
    });
    return {
      appStoreVersionExperiment: await fetchExperiment(context, appStoreVersionExperimentId),
    };
  },

  async delete_app_store_version_experiment(input, context) {
    const appStoreVersionExperimentId = readAppStoreConnectId(
      input.appStoreVersionExperimentId,
      "appStoreVersionExperimentId",
    );
    await deleteResource(
      context,
      resourcePath("/v2/appStoreVersionExperiments", appStoreVersionExperimentId),
      `Deleting the ${experimentLabel}`,
    );
    return { id: appStoreVersionExperimentId, deleted: true };
  },

  async list_app_store_version_experiment_treatments(input, context) {
    const page = await listPage(context, input, {
      path: resourcePath(
        "/v2/appStoreVersionExperiments",
        readAppStoreConnectId(input.appStoreVersionExperimentId, "appStoreVersionExperimentId"),
        "appStoreVersionExperimentTreatments",
      ),
      label: treatmentLabel,
    });
    return {
      appStoreVersionExperimentTreatments: page.items,
      nextCursor: page.nextCursor,
      total: page.total,
    };
  },

  async get_app_store_version_experiment_treatment(input, context) {
    return {
      appStoreVersionExperimentTreatment: await getResource(
        context,
        resourcePath(
          "/v1/appStoreVersionExperimentTreatments",
          readAppStoreConnectId(input.appStoreVersionExperimentTreatmentId, "appStoreVersionExperimentTreatmentId"),
        ),
        treatmentLabel,
      ),
    };
  },

  async create_app_store_version_experiment_treatment(input, context) {
    const appStoreVersionExperimentTreatment = await createResource(context, {
      path: "/v1/appStoreVersionExperimentTreatments",
      type: "appStoreVersionExperimentTreatments",
      label: treatmentLabel,
      attributes: {
        name: requiredInputString(input.name, "name"),
        appIconName: pickOptionalString(input, "appIconName"),
      },

      relationships: {
        appStoreVersionExperimentV2: toOneLinkage(
          "appStoreVersionExperiments",
          readAppStoreConnectId(input.appStoreVersionExperimentId, "appStoreVersionExperimentId"),
        ),
      },
    });
    return { appStoreVersionExperimentTreatment };
  },

  async update_app_store_version_experiment_treatment(input, context) {
    const appStoreVersionExperimentTreatmentId = readAppStoreConnectId(
      input.appStoreVersionExperimentTreatmentId,
      "appStoreVersionExperimentTreatmentId",
    );
    const attributes = {
      name: pickOptionalString(input, "name"),

      appIconName: rawStringOrNull(input.appIconName),
    };
    requireAnyAttribute(attributes, "at least one treatment field to update is required");
    const appStoreVersionExperimentTreatment = await updateResource(context, {
      path: resourcePath("/v1/appStoreVersionExperimentTreatments", appStoreVersionExperimentTreatmentId),
      type: "appStoreVersionExperimentTreatments",
      id: appStoreVersionExperimentTreatmentId,
      label: treatmentLabel,
      attributes,
    });
    return { appStoreVersionExperimentTreatment };
  },

  async delete_app_store_version_experiment_treatment(input, context) {
    const appStoreVersionExperimentTreatmentId = readAppStoreConnectId(
      input.appStoreVersionExperimentTreatmentId,
      "appStoreVersionExperimentTreatmentId",
    );
    await deleteResource(
      context,
      resourcePath("/v1/appStoreVersionExperimentTreatments", appStoreVersionExperimentTreatmentId),
      `Deleting the ${treatmentLabel}`,
    );
    return { id: appStoreVersionExperimentTreatmentId, deleted: true };
  },

  async list_app_store_version_experiment_treatment_localizations(input, context) {
    const page = await listPage(context, input, {
      path: resourcePath(
        "/v1/appStoreVersionExperimentTreatments",
        readAppStoreConnectId(input.appStoreVersionExperimentTreatmentId, "appStoreVersionExperimentTreatmentId"),
        "appStoreVersionExperimentTreatmentLocalizations",
      ),
      label: treatmentLocalizationLabel,
      query: { "filter[locale]": readCommaSeparatedList(input.locales) },
    });
    return {
      appStoreVersionExperimentTreatmentLocalizations: page.items,
      nextCursor: page.nextCursor,
      total: page.total,
    };
  },

  async get_app_store_version_experiment_treatment_localization(input, context) {
    return {
      appStoreVersionExperimentTreatmentLocalization: await getResource(
        context,
        resourcePath(
          "/v1/appStoreVersionExperimentTreatmentLocalizations",
          readAppStoreConnectId(
            input.appStoreVersionExperimentTreatmentLocalizationId,
            "appStoreVersionExperimentTreatmentLocalizationId",
          ),
        ),
        treatmentLocalizationLabel,
      ),
    };
  },

  async create_app_store_version_experiment_treatment_localization(input, context) {
    const appStoreVersionExperimentTreatmentLocalization = await createResource(context, {
      path: "/v1/appStoreVersionExperimentTreatmentLocalizations",
      type: "appStoreVersionExperimentTreatmentLocalizations",
      label: treatmentLocalizationLabel,
      attributes: { locale: requiredInputString(input.locale, "locale") },
      relationships: {
        appStoreVersionExperimentTreatment: toOneLinkage(
          "appStoreVersionExperimentTreatments",
          readAppStoreConnectId(input.appStoreVersionExperimentTreatmentId, "appStoreVersionExperimentTreatmentId"),
        ),
      },
    });
    return { appStoreVersionExperimentTreatmentLocalization };
  },

  async delete_app_store_version_experiment_treatment_localization(input, context) {
    const appStoreVersionExperimentTreatmentLocalizationId = readAppStoreConnectId(
      input.appStoreVersionExperimentTreatmentLocalizationId,
      "appStoreVersionExperimentTreatmentLocalizationId",
    );
    await deleteResource(
      context,
      resourcePath(
        "/v1/appStoreVersionExperimentTreatmentLocalizations",
        appStoreVersionExperimentTreatmentLocalizationId,
      ),
      `Deleting the ${treatmentLocalizationLabel}`,
    );
    return { id: appStoreVersionExperimentTreatmentLocalizationId, deleted: true };
  },

  async create_app_store_version_promotion(input, context) {
    const appStoreVersionPromotion = await createResource(context, {
      path: "/v1/appStoreVersionPromotions",
      type: "appStoreVersionPromotions",
      label: promotionLabel,
      relationships: {
        appStoreVersion: toOneLinkage(
          "appStoreVersions",
          readAppStoreConnectId(input.appStoreVersionId, "appStoreVersionId"),
        ),
        appStoreVersionExperimentTreatment: toOneLinkage(
          "appStoreVersionExperimentTreatments",
          readAppStoreConnectId(input.appStoreVersionExperimentTreatmentId, "appStoreVersionExperimentTreatmentId"),
        ),
      },
    });
    return { appStoreVersionPromotion };
  },
};

function requireInputInteger(value: unknown, fieldName: string): number {
  const integer = optionalInteger(value);
  if (integer === undefined) {
    throw new ProviderRequestError(400, `${fieldName} is required`);
  }
  return integer;
}

function readInlineVersion(input: Record<string, unknown>): Array<Record<string, unknown>> | undefined {
  const deepLink = pickOptionalString(input, "deepLink");
  const localizations = looseArray(input.localizations).map((item, index) => {
    const localization = recordOrEmpty(item);
    return {
      type: "appCustomProductPageLocalizations",
      id: inlineLocalizationId(index),
      attributes: compactObject({
        locale: requiredInputString(localization.locale, `localizations[${index}].locale`),
        promotionalText: pickOptionalString(localization, "promotionalText"),
      }),
    };
  });
  if (deepLink === undefined && localizations.length === 0) {
    return undefined;
  }

  const version = compactObject({
    type: "appCustomProductPageVersions",
    id: inlineVersionId,
    attributes: deepLink === undefined ? undefined : { deepLink },
    relationships:
      localizations.length === 0
        ? undefined
        : {
            appCustomProductPageLocalizations: toManyLinkage(
              "appCustomProductPageLocalizations",
              localizations.map((localization) => localization.id),
            ),
          },
  });
  return [version, ...localizations];
}

function readExperiment(resource: Record<string, unknown>): Record<string, unknown> {
  return {
    ...normalizeResource(resource, experimentLabel),
    latestControlVersionId: readRelationshipId(resource, "latestControlVersion"),
  };
}

async function fetchExperiment(
  context: AppStoreConnectContext,
  appStoreVersionExperimentId: string,
): Promise<Record<string, unknown>> {
  const { payload } = await requestAppStoreConnect(context, {
    path: resourcePath("/v2/appStoreVersionExperiments", appStoreVersionExperimentId),
    query: experimentInclude,
  });
  return readExperiment(readResource(payload, experimentLabel));
}
