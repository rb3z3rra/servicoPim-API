# Guia de Setup

Guia rápido para preparar a API ServiçoPIM em desenvolvimento, testes e Docker.

## Pré-requisitos

- Node.js 20+
- Docker com `docker compose`
- npm

## Instalação local

```bash
npm install
cp .env.example .env
```

Preencha os valores do `.env`. Os segredos obrigatórios são:

- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`

## Ambientes

- `.env`: desenvolvimento local e uso manual da API.
- `.env.test`: testes automatizados e carga isolada.
- `docker-compose.yml`: Postgres, API e PgAdmin de desenvolvimento.
- `docker-compose.test.yml`: Postgres isolado para testes.

Portas padrão:

- API local: `9090`
- Postgres de desenvolvimento: `5433`
- Postgres de teste: `5434`
- PgAdmin: `8080`

## Rodar Em Desenvolvimento

Para subir apenas o banco e o PgAdmin via Docker:

```bash
docker compose up postgres pgadmin -d
npm run db:migrate
npm run db:seed
npm run dev
```

Nesse modo:

- Banco: `localhost:5433`
- API: `http://localhost:9090`
- PgAdmin: `http://localhost:8080`

Evite subir a API no Docker e via `npm run dev` ao mesmo tempo, porque ambas usam a porta `9090`.

Para rodar tudo por Docker:

```bash
docker compose up --build -d
```

## Usuários Seed

O seed cria usuários funcionais para desenvolvimento e testes.

Senha padrão:

```text
seed123
```

Principais acessos:

- `gestor@seed.local`
- `supervisor@seed.local`
- `tecnico.norte@seed.local`
- `tecnico.sul@seed.local`
- `solicitante.linha1@seed.local`
- `solicitante.linha2@seed.local`

## Testes

Unitários:

```bash
npm run test:unit
```

Integração com Postgres isolado:

```bash
npm run test:integration:docker
```

Esse comando:

1. Sobe `postgres-test` em `localhost:5434`.
2. Carrega `.env.test`.
3. Aplica migrations.
4. Executa a suíte de integração.
5. Derruba o ambiente de teste ao final.

## Testes De Carga

Os testes de carga usam k6 em container e banco isolado de teste.

Smoke:

```bash
npm run load:smoke
```

Demais cenários:

```bash
npm run load:steady
npm run load:spike
```

Esses comandos usam `.env.test`, banco `servicopim_test` e porta `9091` para a API de carga.

## Teste Manual Da API

Healthcheck:

```bash
curl http://localhost:9090/health
```

Login:

```bash
curl -X POST http://localhost:9090/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"gestor@seed.local","senha":"seed123"}'
```

Fluxo manual recomendado:

1. Verificar `GET /health`.
2. Fazer login.
3. Consultar dashboard.
4. Cadastrar ou listar equipamentos.
5. Abrir uma ordem de serviço.
6. Atribuir técnico.
7. Iniciar e concluir a ordem.
8. Conferir histórico e relatórios.

## Endpoints Úteis

- API: `http://localhost:9090`
- Healthcheck: `http://localhost:9090/health`
- PgAdmin: `http://localhost:8080`
