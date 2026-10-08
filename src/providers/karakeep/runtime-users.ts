import type { KarakeepHandlerMap } from "./runtime-helpers.ts";

import { nullableString, requiredString } from "../../core/cast.ts";
import { providerResponseError, requiredResponseRecord } from "../provider-runtime.ts";

export const karakeepUserActionHandlers: KarakeepHandlerMap = {
  async get_current_user(_input, context) {
    const user = requiredResponseRecord(
      await context.request({ method: "GET", path: "/users/me" }),
      "the current user",
    );
    return {
      id: requiredString(user.id, "the current user id", providerResponseError),
      name: nullableString(user.name) ?? null,
      email: nullableString(user.email) ?? null,
      image: nullableString(user.image) ?? null,
      localUser: user.localUser === true,
    };
  },
  async get_current_user_stats(_input, context) {
    return requiredResponseRecord(
      await context.request({ method: "GET", path: "/users/me/stats" }),
      "the current user stats",
    );
  },
};
