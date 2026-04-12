# Guia de Setup e Instalação

Guia rápido para rodar a API com migrations e testes reproduzíveis.

## Pré-requisitos
- Node.js 20+
- Docker com `docker compose`
- PostgreSQL local ou container

## Instalação
```bash
npm install
```

Copie `.env.example` para `.env` e preencha os valores. Os segredos obrigatórios são:
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`

## Desenvolvimento local
Se quiser usar apenas o banco em container:
```bash
docker compose up postgres pgadmin -d
npm run db:migrate
npm run dev
```

Para rodar tudo por Docker:
```bash
docker compose up --build -d
```

## Testes
Unitários:
```bash
npm test
```

Integrados com Postgres isolado:
```bash
npm run test:integration:docker
```

Esse comando:
1. sobe `postgres-test` em `localhost:5434`
2. carrega `.env.test`
3. aplica migrations
4. roda a suíte integrada
5. derruba os containers no final

## Endpoints úteis
- API: `http://localhost:9090`
- Healthcheck: `http://localhost:9090/health`
- PgAdmin: `http://localhost:8080`
