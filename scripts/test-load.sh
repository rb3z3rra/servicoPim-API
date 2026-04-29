#!/usr/bin/env bash
set -euo pipefail

SCENARIO="${1:-smoke}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

case "${SCENARIO}" in
  smoke|steady|spike)
    ;;
  *)
    echo "Cenario invalido: ${SCENARIO}. Use: smoke, steady ou spike."
    exit 1
    ;;
esac

cleanup() {
  if [[ -n "${API_PID:-}" ]]; then
    kill "${API_PID}" >/dev/null 2>&1 || true
  fi
  docker compose -f "${ROOT_DIR}/docker-compose.test.yml" down -v >/dev/null 2>&1 || true
}

trap cleanup EXIT

if ! docker info >/dev/null 2>&1; then
  echo "Docker indisponivel para os testes de carga. Verifique acesso ao daemon Docker."
  exit 1
fi

cd "${ROOT_DIR}"

echo "Subindo banco isolado de teste/carga..."
docker compose -f docker-compose.test.yml up -d --wait postgres-test

echo "Carregando .env.test..."
set -a
source .env.test
set +a

export DISABLE_RATE_LIMIT=true
export NODE_ENV=load

echo "Aplicando migrations no banco ${DB_NAME}..."
npm run db:migrate

echo "Carregando seed no banco ${DB_NAME}..."
npm run db:seed

echo "Compilando API..."
npm run build

echo "Subindo API de carga em http://localhost:${PORT}..."
node dist/src/server.js &
API_PID=$!

echo "Aguardando API responder..."
for _ in {1..30}; do
  if curl -fsS "http://localhost:${PORT}/health" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

curl -fsS "http://localhost:${PORT}/health" >/dev/null

echo "Rodando k6 (${SCENARIO}) contra banco isolado ${DB_NAME}..."
docker run --rm --network host \
  -e BASE_URL="http://localhost:${PORT}" \
  -e LOGIN_EMAIL="supervisor@seed.local" \
  -e LOGIN_SENHA="seed123" \
  -v "${ROOT_DIR}/load-tests:/scripts" \
  grafana/k6:latest run "/scripts/${SCENARIO}.js"

echo "Teste de carga ${SCENARIO} finalizado."
