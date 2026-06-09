#!/usr/bin/env node
/**
 * validate-governance-audit-links.mjs
 *
 * Verifica em build/CI que todo bloco `audit-link` na Governança aponta
 * para um relatório existente em .lovable/audit/. Falha com exit 1 se
 * encontrar links órfãos — protege a memória institucional viva.
 *
 * Uso:
 *   node scripts/validate-governance-audit-links.mjs
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const SECTIONS_DIR = 'src/data/governance/sections';
const AUDIT_PREFIX = '.lovable/audit/';

const files = readdirSync(SECTIONS_DIR).filter((f) => f.endsWith('.ts'));
const missing = [];
const found = [];

for (const file of files) {
  const src = readFileSync(join(SECTIONS_DIR, file), 'utf8');
  const re = /auditPath:\s*['"`]([^'"`]+)['"`]/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const p = m[1];
    if (!p.startsWith(AUDIT_PREFIX)) {
      missing.push({ file, path: p, reason: `não começa com ${AUDIT_PREFIX}` });
      continue;
    }
    if (!existsSync(p)) {
      missing.push({ file, path: p, reason: 'arquivo inexistente' });
    } else {
      found.push({ file, path: p });
    }
  }
}

console.log(`✓ ${found.length} audit-links válidos.`);
if (missing.length > 0) {
  console.error(`\n✗ ${missing.length} audit-link(s) órfão(s):`);
  for (const x of missing) {
    console.error(`  - ${x.file} → ${x.path}  (${x.reason})`);
  }
  process.exit(1);
}
