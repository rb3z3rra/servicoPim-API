#!/usr/bin/env bash
set -euo pipefail

cleanup() {
  docker compose -f docker-compose.test.yml down -v >/dev/null 2>&1 || true
}

trap cleanup EXIT

if ! docker info >/dev/null 2>&1; then
  echo "Docker indisponivel para os testes de integracao. Verifique acesso ao daemon Docker."
  exit 1
fi

docker compose -f docker-compose.test.yml up -d --wait postgres-test
set -a
source .env.test
set +a
npm run db:migrate
npm run test:integration:jest
