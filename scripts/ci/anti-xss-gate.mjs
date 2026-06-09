#!/usr/bin/env node
/**
 * Anti-XSS CI Gate — falha o build se reintroduzir HTML injection.
 *
 * Bloqueia em src/:
 *   - dangerouslySetInnerHTML
 *   - __html
 *   - .innerHTML = / .outerHTML = (atribuições)
 *   - insertAdjacentHTML(
 *   - document.write( / document.writeln(
 *   - new DOMParser(
 *
 * Allowlist (motivos institucionais):
 *   - src/utils/safeFormattedText.tsx                → comentários da política
 *   - src/utils/pdfGenerator.tsx                     → leitura (getter) do DOM já renderizado p/ Browserless
 *   - src/components/pdf/proposta/primitives.tsx     → CSS estático de runtime p/ PDF/Browserless (constante local, sem interpolação)
 *   - src/test/** / src/tests/**                     → testes verificam vetores XSS como strings
 *   - src/data/governance/**                         → documentação textual da política (strings, nunca toca o DOM)
 *   - scripts/ci/anti-xss-gate.mjs                   → este próprio script
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");

const ALLOW = new Set([
  "src/utils/safeFormattedText.tsx",
  "src/utils/pdfGenerator.tsx",
  "src/components/pdf/proposta/primitives.tsx",
]);
const ALLOW_PREFIX = ["src/test/", "src/tests/", "src/data/governance/", "src/data/help/"];

const PATTERNS = [
  { name: "dangerouslySetInnerHTML", re: /dangerouslySetInnerHTML/ },
  { name: "__html literal", re: /__html\s*:/ },
  { name: "innerHTML assignment", re: /\.innerHTML\s*=/ },
  { name: "outerHTML assignment", re: /\.outerHTML\s*=/ },
  { name: "insertAdjacentHTML", re: /\.insertAdjacentHTML\s*\(/ },
  { name: "document.write", re: /document\.write(ln)?\s*\(/ },
  { name: "new DOMParser", re: /new\s+DOMParser\s*\(/ },
];

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) yield* walk(full);
    else if (/\.(ts|tsx|js|jsx)$/.test(entry)) yield full;
  }
}

function isAllowed(rel) {
  if (ALLOW.has(rel)) return true;
  return ALLOW_PREFIX.some((p) => rel.startsWith(p));
}

const violations = [];
for (const file of walk(SRC)) {
  const rel = relative(ROOT, file).replaceAll("\\", "/");
  if (isAllowed(rel)) continue;
  const text = readFileSync(file, "utf8");
  const lines = text.split("\n");
  lines.forEach((line, i) => {
    // Ignora linhas de comentário (a política é citada em docstrings/comments).
    const trimmed = line.trim();
    if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) return;
    for (const { name, re } of PATTERNS) {
      if (re.test(line)) violations.push({ rel, line: i + 1, name, text: line.trim() });
    }
  });
}

if (violations.length) {
  console.error("\n✖ Anti-XSS Gate — HTML injection detectada:\n");
  for (const v of violations) {
    console.error(`  ${v.rel}:${v.line}  [${v.name}]`);
    console.error(`     ${v.text}`);
  }
  console.error(
    "\nRenderize via SafeNarrative/renderSafeFormattedText (@/utils/safeFormattedText)." +
      "\nSe a exceção for institucional, atualize ALLOW em scripts/ci/anti-xss-gate.mjs com justificativa.\n",
  );
  process.exit(1);
}

console.log(`✓ Anti-XSS Gate — 0 violações (${ALLOW.size} arquivos allowlisted).`);
