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

Copie `.env.example` para `.env`:

```bash
cp .env.example .env
```

Preencha os valores. Os segredos obrigatórios são:
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`

## Estrutura de ambientes
- `.env`: ambiente normal de desenvolvimento
- `.env.test`: ambiente isolado para testes integrados
- `docker-compose.yml`: infraestrutura normal
- `docker-compose.test.yml`: infraestrutura exclusiva de teste

Resumo:
- Postman e uso manual da API: ambiente normal
- suíte integrada automatizada: ambiente de teste

## Portas usadas
- API local: `9090`
- Postgres de desenvolvimento via Docker: `5433`
- Postgres de teste: `5434`
- PgAdmin: `8080`

## Desenvolvimento local
Se quiser usar apenas o banco em container:
```bash
docker compose up postgres pgadmin -d
npm run db:migrate
npm run dev
```

Nesse modo:
- o banco sobe em `localhost:5433`
- a API sobe localmente em `localhost:9090`
- você pode usar o Postman normalmente

Importante:
- não suba a API no Docker e localmente ao mesmo tempo
- isso causa conflito na porta `9090`

Para rodar tudo por Docker:
```bash
docker compose up --build -d
```

Se usar esse modo:
- não rode `npm run dev` ao mesmo tempo

## Primeiro supervisor
Como `POST /usuarios` exige autenticação de `SUPERVISOR`, o primeiro supervisor deve existir antes do uso normal da API.

Opções:
- inserir manualmente o primeiro supervisor no banco
- usar um seed/script interno, se o time optar por criar depois

Campos necessários no primeiro usuário:
- `nome`
- `email`
- `matricula`
- `senha_hash`
- `perfil = SUPERVISOR`
- `setor`
- `ativo = true`

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

Se quiser rodar a integração manualmente:
```bash
docker compose -f docker-compose.test.yml up -d
set -a
source .env.test
set +a
npm run db:migrate
npm run test:integration:jest
```

Se o Docker não estiver acessível, os testes integrados vão falhar ao conectar em `127.0.0.1:5434`.

## Teste manual da API
Use o arquivo [`testes-api.http`](./testes-api.http) como roteiro.

Fluxo recomendado:
1. verificar `GET /health`
2. fazer login como supervisor
3. criar usuários de teste
4. criar equipamento
5. abrir OS
6. atribuir técnico
7. atualizar status
8. concluir OS
9. consultar histórico

## Endpoints úteis
- API: `http://localhost:9090`
- Healthcheck: `http://localhost:9090/health`
- PgAdmin: `http://localhost:8080`
