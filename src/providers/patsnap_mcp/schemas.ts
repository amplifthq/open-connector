import type { JsonSchema } from "../../core/types.ts";

import { s } from "../../core/json-schema.ts";

export const patsnapResultSchema: JsonSchema = s.object("The normalized Patsnap MCP tool result.", {
  result: s.unknown("Structured MCP content when available; otherwise the original MCP content envelope."),
});
