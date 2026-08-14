import { describe, expect, it } from "vitest";
import { provider } from "./definition.ts";

const googleCalendarReadonlyScope = "https://www.googleapis.com/auth/calendar.readonly";

describe("Google Calendar provider definition", () => {
  it("requests only read-only Calendar access for the OpenMeld production baseline", () => {
    const oauth = provider.auth.find((auth) => auth.type === "oauth2");

    expect(oauth?.scopes).toEqual([googleCalendarReadonlyScope]);
  });
});
