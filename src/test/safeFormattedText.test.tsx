import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SafeNarrative, renderSafeFormattedText } from "@/utils/safeFormattedText";

const html = (node: React.ReactNode) => renderToStaticMarkup(<>{node}</>);

describe("safeFormattedText — XSS hardening", () => {
  it("escapes <script> tags as text", () => {
    const out = html(renderSafeFormattedText("<script>alert(1)</script>"));
    expect(out).not.toContain("<script>");
    expect(out).toContain("&lt;script&gt;");
  });

  it("escapes <img onerror> payloads", () => {
    const out = html(renderSafeFormattedText('<img src=x onerror="alert(1)">'));
    expect(out).not.toContain("<img");
    expect(out).toContain("&lt;img");
  });

  it("escapes <iframe>, javascript:, and SVG injections", () => {
    const payloads = [
      "<iframe src=javascript:alert(1)>",
      '<a href="javascript:alert(1)">x</a>',
      '<svg onload="alert(1)"></svg>',
    ];
    for (const p of payloads) {
      const out = html(renderSafeFormattedText(p));
      // No real tags emitted — everything escaped to entities
      expect(out).not.toMatch(/<(iframe|svg|a)\b/);
      expect(out).toContain("&lt;");
    }
  });

  it("converts **bold** to <strong> via JSX (not string injection)", () => {
    const out = html(renderSafeFormattedText("hello **world**"));
    expect(out).toBe("hello <strong>world</strong>");
  });

  it("does not interpret malformed markdown as HTML", () => {
    const out = html(renderSafeFormattedText("**<b>x</b>**"));
    expect(out).toContain("<strong>");
    expect(out).toContain("&lt;b&gt;");
    expect(out).not.toContain("<b>x</b>");
  });

  it("SafeNarrative renders headings, lists, paragraphs without HTML injection", () => {
    const text = "## Título\n- item **bold** <script>x</script>\n\nParágrafo \"aspas\"";
    const out = html(<SafeNarrative text={text} />);
    expect(out).toContain("<h2");
    expect(out).toContain("<li");
    expect(out).toContain("<strong>bold</strong>");
    expect(out).not.toContain("<script>");
    expect(out).toContain("&quot;aspas&quot;");
  });
});
