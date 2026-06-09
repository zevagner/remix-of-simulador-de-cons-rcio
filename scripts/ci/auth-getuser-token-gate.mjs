#!/usr/bin/env node
// Guard-rail: falha se qualquer arquivo em supabase/functions/** contiver
// `auth.getUser()` sem argumento (padrão que causou 401 intermitente).
// Permitido apenas `auth.getUser(<expr>)` ou uso via helper canônico.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = "supabase/functions";
const OFFENDERS = [];
// matches `.getUser()` with optional whitespace, e.g. `auth.getUser( )`
const RX = /\.getUser\s*\(\s*\)/g;

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) { walk(p); continue; }
    if (!p.endsWith(".ts")) continue;
    const src = readFileSync(p, "utf8");
    const lines = src.split("\n");
    lines.forEach((line, i) => {
      // skip comments
      const trimmed = line.trim();
      if (trimmed.startsWith("//") || trimmed.startsWith("*")) return;
      if (RX.test(line)) {
        OFFENDERS.push(`${p}:${i + 1}: ${trimmed}`);
      }
      RX.lastIndex = 0;
    });
  }
}

try { walk(ROOT); } catch (e) {
  console.error("[auth-getuser-token-gate] erro:", e.message);
  process.exit(2);
}

if (OFFENDERS.length) {
  console.error("\n❌ auth.getUser() sem token detectado — use auth.getUser(token) ou authenticateRequest():\n");
  for (const o of OFFENDERS) console.error("  " + o);
  console.error("\nPolítica: docs/security/auth-edge-policy.md\n");
  process.exit(1);
}
console.log("✅ auth-getuser-token-gate: nenhum getUser() sem token em supabase/functions/");
