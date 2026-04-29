# Testes de carga

Os testes de carga usam k6 em Docker e rodam contra o banco isolado definido em `.env.test`.

Esse fluxo evita tocar no banco principal do desenvolvimento (`.env` / `servicopim`).

## Ambiente usado

- Compose: `docker-compose.test.yml`
- Env: `.env.test`
- Banco: `servicopim_test`
- Porta Postgres: `5434`
- Porta API: `9091`
- `NODE_ENV`: sobrescrito para `load` durante a execucao
- Rate limit: desativado via `DISABLE_RATE_LIMIT=true`

## Execucao

```bash
npm run load:smoke
npm run load:steady
npm run load:spike
```

Cada script:

1. sobe o Postgres isolado de teste
2. carrega `.env.test`
3. aplica migrations
4. carrega seed no banco `servicopim_test`
5. compila a API
6. sobe a API em `http://localhost:9091`
7. executa k6 via Docker
8. derruba o ambiente ao final

## Cenarios

- `smoke.js`: valida rapidamente se login e endpoints principais respondem.
- `steady.js`: simula carga estavel de uso normal.
- `spike.js`: simula pico rapido de usuarios consultando dashboard, ordens e equipamentos.

Os limites iniciais sao conservadores. Ajuste `vus`, `duration` e `thresholds` conforme o servidor real.
