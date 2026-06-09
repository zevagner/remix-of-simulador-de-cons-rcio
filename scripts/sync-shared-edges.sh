#!/usr/bin/env bash
# Sincroniza scripts/_shared-edges/*.ts para o _lib/ de cada edge.
# Fonte da verdade está FORA de supabase/functions/ porque o deployer Lovable
# rejeita pastas com underscore como slug de edge function.
set -e
SHARED_DIR="scripts/_shared-edges"
[ -d "$SHARED_DIR" ] || { echo "❌ $SHARED_DIR não existe"; exit 1; }
for fn_dir in supabase/functions/*/; do
  name=$(basename "$fn_dir")
  [ -f "$fn_dir/index.ts" ] || continue
  [ -d "$fn_dir/_lib" ] || continue
  for f in "$SHARED_DIR"/*.ts; do
    cp "$f" "$fn_dir/_lib/$(basename $f)"
  done
  echo "✓ sync $name"
done
echo "✅ Sincronização concluída"
