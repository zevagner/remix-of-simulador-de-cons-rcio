#!/usr/bin/env node
/**
 * CI Gate — Auth Pattern Enforcement (Onda 2)
 *
 * Falha o pipeline se algum arquivo em supabase/functions/ contiver padrões de
 * autenticação frágil que já foram banidos:
 *
 *   - getClaims(                → decode local sem verificar assinatura/exp
 *   - atob(                     → decode manual de JWT
 *   - token.split('.')          → parsing manual de JWT
 *
 * Substitutos canônicos: authenticateRequest() / authenticateAdmin() em
 * supabase/functions/_shared/auth.ts (usa supabase.auth.getUser() — verifica
 * assinatura + expiração no servidor).
 *
 * Exceções devem ser justificadas via comentário no formato:
 *   // ci-auth-allow: <motivo>
 * na mesma linha do match.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'supabase/functions';
const BANNED = [
  { re: /getClaims\s*\(/, label: 'getClaims(' },
  { re: /\batob\s*\(/, label: 'atob(' },
  { re: /token\s*\.\s*split\s*\(\s*['"`]\.['"`]/, label: "token.split('.')" },
];
const ALLOW_TAG = 'ci-auth-allow:';

// Arquivos isentos por design:
//  - _lib/rateLimit.ts: extrai user_id do JWT apenas para bucket de rate-limit
//    (a autenticação real continua via authenticateRequest/authenticateAdmin).
//  - _shared/auth.ts: helper canônico — documenta os padrões banidos em comentários.
const EXEMPT_FILES = [
  /\/_lib\/rateLimit\.ts$/,
  /\/_shared\/auth\.ts$/,
];

const violations = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (entry === 'node_modules' || entry.startsWith('.')) continue;
      walk(p);
    } else if (/\.(ts|tsx|js|mjs)$/.test(entry)) {
      if (EXEMPT_FILES.some((re) => re.test(p))) continue;
      const src = readFileSync(p, 'utf8');
      const lines = src.split('\n');
      lines.forEach((line, i) => {
        // Ignora linhas que são apenas comentário (documentação/exemplos).
        if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
        for (const { re, label } of BANNED) {
          if (re.test(line) && !line.includes(ALLOW_TAG)) {
            violations.push({ file: p, line: i + 1, label, snippet: line.trim().slice(0, 160) });
          }
        }
      });
    }
  }
}

try {
  walk(ROOT);
} catch (err) {
  console.error(`[auth-pattern-gate] cannot scan ${ROOT}:`, err.message);
  process.exit(2);
}

if (violations.length) {
  console.error('\n❌ CI auth-pattern-gate: padrões banidos detectados\n');
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  →  ${v.label}`);
    console.error(`    ${v.snippet}`);
  }
  console.error(
    '\nUse authenticateRequest()/authenticateAdmin() de supabase/functions/_shared/auth.ts.\n' +
    `Se for justificado, adicione \`// ${ALLOW_TAG} <motivo>\` na mesma linha.\n`
  );
  process.exit(1);
}

console.log('✅ auth-pattern-gate: nenhum padrão banido encontrado.');
