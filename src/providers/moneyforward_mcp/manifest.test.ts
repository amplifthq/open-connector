import { describe, expect, it } from "vitest";
import { canonicalJson, canonicalOfficeName, schemaDigest } from "./manifest.ts";

describe("schemaDigest", () => {
  const base = {
    type: "object",
    properties: {
      description: { type: "string", enum: ["a", "b"] },
      kind: { type: "object", const: { description: "付款" } },
    },
    required: ["description"],
    description: "説明",
  };

  it("ignores member order", () => {
    const reordered = {
      description: "説明",
      required: ["description"],
      properties: { kind: base.properties.kind, description: base.properties.description },
      type: "object",
    };
    expect(schemaDigest(reordered)).toBe(schemaDigest(base));
  });

  it.each([
    ["annotation wording", { ...base, description: "説明2" }],
    [
      "data inside const",
      { ...base, properties: { ...base.properties, kind: { type: "object", const: { description: "収款" } } } },
    ],
    [
      "a business field named description",
      { ...base, properties: { ...base.properties, description: { type: "string", enum: ["a"] } } },
    ],
    ["required", { ...base, required: [] }],
    ["dependentRequired keyed by description", { ...base, dependentRequired: { description: ["kind"] } }],
  ])("changes when %s changes", (_label, changed) => {
    expect(schemaDigest(changed)).not.toBe(schemaDigest(base));
  });

  it("sorts member names by UTF-16 code units", () => {
    expect(canonicalJson({ b: 1, a: [true, null, "x"], A: 2 })).toBe('{"A":2,"a":[true,null,"x"],"b":1}');
  });
});

describe("canonicalOfficeName", () => {
  it.each([
    ["株式会社テスト", "(株)テスト"],
    ["株式会社テスト", "（株）テスト"],
    ["株式会社テスト", "㈱テスト"],
    ["株式会社 テスト", "株式会社　テスト"],
    ["ＡＢＣ有限会社", "ABC(有)"],
    ["テスト合同会社", "テスト (同)"],
  ])("treats %s and %s as the same office", (left, right) => {
    expect(canonicalOfficeName(left)).toBe(canonicalOfficeName(right));
  });

  it.each([
    ["株式会社テスト", "株式会社テスト2"],
    ["株式会社テスト", "有限会社テスト"],
    ["abc株式会社", "ABC株式会社"],
  ])("keeps %s and %s apart", (left, right) => {
    expect(canonicalOfficeName(left)).not.toBe(canonicalOfficeName(right));
  });
});
