#!/usr/bin/env bash
set -euo pipefail

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js nao encontrado. Instale Node.js 18+ antes de continuar."
  exit 1
fi

node_version=$(node -v)
echo "Node detectado: ${node_version}"

if [ ! -f package.json ]; then
  echo "package.json nao encontrado. Adicione as dependencias do runtime conforme README-INSTALACAO-REAL.md."
  exit 1
fi

npm install

echo "Dependencias instaladas. Rode: npm run check && npm run dev"
