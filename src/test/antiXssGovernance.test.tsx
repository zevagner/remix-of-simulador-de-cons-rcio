import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { execSync } from "node:child_process";
import { renderSafeFormattedText, SafeNarrative } from "@/utils/safeFormattedText";

const html = (node: React.ReactNode) => renderToStaticMarkup(<>{node}</>);

describe("Anti-XSS Governance — vetores estendidos", () => {
  it("escapa style injection", () => {
    const out = html(renderSafeFormattedText('<style>body{display:none}</style>'));
    expect(out).not.toContain("<style>");
    expect(out).toContain("&lt;style&gt;");
  });

  it("escapa href javascript: (link malicioso)", () => {
    const out = html(renderSafeFormattedText('<a href="javascript:alert(1)">x</a>'));
    expect(out).not.toMatch(/<a\b/);
    expect(out.toLowerCase()).toContain("&lt;a");
  });

  it("escapa payloads codificados em entidades HTML", () => {
    // Entrada já contém entidades — devem ser duplo-escapadas (& vira &amp;)
    const out = html(renderSafeFormattedText("&#x3C;script&#x3E;alert(1)&#x3C;/script&#x3E;"));
    expect(out).not.toContain("<script>");
    expect(out).toContain("&amp;#x3C;script&amp;#x3E;");
  });

  it("escapa escapes unicode (\\u003c)", () => {
    const out = html(renderSafeFormattedText("\u003cscript\u003ealert(1)\u003c/script\u003e"));
    expect(out).not.toContain("<script>");
    expect(out).toContain("&lt;script&gt;");
  });

  it("escapa HTML quebrado / não fechado", () => {
    const out = html(renderSafeFormattedText("<img src=x onerror=alert(1)"));
    expect(out).not.toMatch(/<img\b/);
    expect(out).toContain("&lt;img");
  });

  it("markdown aninhado **A **B** C** não vaza HTML", () => {
    const out = html(renderSafeFormattedText("**A **B** C**"));
    expect(out).not.toMatch(/<(?!\/?strong)/);
  });

  it("aspas simples e duplas em narrativa não viram atributos", () => {
    const out = html(<SafeNarrative text={`teste 'simples' e "duplas"`} />);
    expect(out).toContain("&#x27;simples&#x27;");
    expect(out).toContain("&quot;duplas&quot;");
  });
});

describe("Anti-XSS Governance — CI gate", () => {
  it("scripts/ci/anti-xss-gate.mjs reporta 0 violações no estado atual", () => {
    const out = execSync("node scripts/ci/anti-xss-gate.mjs", { encoding: "utf8" });
    expect(out).toContain("0 violações");
  });
});
