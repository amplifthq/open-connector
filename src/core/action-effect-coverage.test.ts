import type { ActionDefinition, ProviderDefinition } from "./types.ts";

import { describe, expect, it } from "vitest";
import { provider as cloudflareBrowserRendering } from "../providers/cloudflare_browser_rendering/definition.ts";
import { provider as cloudflareDns } from "../providers/cloudflare_dns/definition.ts";
import { provider as cloudflareR2 } from "../providers/cloudflare_r2/definition.ts";
import { provider as cloudflareWorker } from "../providers/cloudflare_worker/definition.ts";
import { provider as figma } from "../providers/figma/definition.ts";
import { provider as gmail } from "../providers/gmail/definition.ts";
import { provider as googleCalendar } from "../providers/googlecalendar/definition.ts";
import { provider as googleDrive } from "../providers/googledrive/definition.ts";
import { provider as linear } from "../providers/linear/definition.ts";
import { provider as notion } from "../providers/notion/definition.ts";
import { provider as posthog } from "../providers/posthog/definition.ts";

const effectRequiredProviders: ProviderDefinition[] = [
  cloudflareBrowserRendering,
  cloudflareDns,
  cloudflareR2,
  cloudflareWorker,
  figma,
  gmail,
  googleCalendar,
  googleDrive,
  linear,
  notion,
  posthog,
];

describe("action effect coverage", () => {
  it("declares an effect for every action consumed by guarded clients", () => {
    const missing = effectRequiredProviders.flatMap((provider) =>
      provider.actions.filter((action) => action.effect === undefined).map((action) => action.id),
    );

    expect(missing).toEqual([]);
  });

  it.each([
    { actionId: "gmail.fetch_emails", expectedEffect: "read", provider: gmail },
    { actionId: "gmail.send_email", expectedEffect: "write", provider: gmail },
    { actionId: "gmail.move_to_trash", expectedEffect: "destructive", provider: gmail },
    { actionId: "posthog.run_query", expectedEffect: "read", provider: posthog },
    { actionId: "posthog.cancel_query", expectedEffect: "destructive", provider: posthog },
  ] as const)("declares $actionId as $expectedEffect", ({ provider, actionId, expectedEffect }) => {
    expect(requireAction(provider, actionId).effect).toBe(expectedEffect);
  });
});

function requireAction(provider: ProviderDefinition, actionId: string): ActionDefinition {
  const action = provider.actions.find((candidate) => candidate.id === actionId);
  if (!action) {
    throw new Error(`Expected action ${actionId}`);
  }
  return action;
}
