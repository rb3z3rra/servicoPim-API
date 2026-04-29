# ServicoPIM API

API REST do ServicoPIM, responsavel por autenticacao, autorizacao, regras de negocio, persistencia, auditoria e indicadores do sistema de ordens de servico.

## Visao geral

O backend concentra:

- autenticacao e sessao
- autorizacao por perfil
- regras de negocio
- persistencia em PostgreSQL
- historico/auditoria de O.S.
- configuracao de prazo de atendimento
- dashboard agregado
- testes unitarios, integracao e carga

## Tecnologias

- `Node.js`
- `TypeScript`
- `Express 5`
- `TypeORM`
- `PostgreSQL`
- `Zod`
- `JWT`
- `bcryptjs`
- `Jest`
- `Supertest`
- `Docker`
- `k6` para carga

## Perfis

- `SOLICITANTE`
  - cria O.S.
  - visualiza as proprias solicitacoes

- `TECNICO`
  - assume O.S. abertas disponiveis
  - inicia execucao
  - registra apontamentos
  - atualiza status permitido
  - conclui O.S. sob sua responsabilidade

- `SUPERVISOR`
  - administra usuarios funcionais conforme hierarquia
  - administra equipamentos
  - atribui tecnico
  - cancela O.S.
  - acessa historico e dashboard operacional

- `GESTOR`
  - possui visao geral de gestao
  - acessa configuracao de prazo de atendimento
  - pode administrar perfis funcionais conforme regra atual

## Entidades principais

- `Usuario`
- `Equipamento`
- `OrdemServico`
- `HistoricoOS`
- `ApontamentoOS`
- `RefreshToken`
- `ConfiguracaoPrazoAtendimento`

## Estrutura

```text
src/
  app.ts
  server.ts
  config/
  controllers/
  database/
    migrations/
  dtos/
  entities/
  errors/
  middleware/
  routes/
  scripts/
  services/
  types/
__test__/
load-tests/
scripts/
```

## Seguranca

O backend usa:

- senha com hash
- `accessToken` JWT de curta duracao
- `refreshToken` em cookie `HttpOnly`
- armazenamento server-side de refresh token
- refresh token revogavel
- logout com revogacao no servidor
- `helmet`
- `express-rate-limit`
- validacao de entrada com `Zod`
- controle de acesso com `ensureAuth` e `ensureRole`
- headers `no-store` para rotas autenticadas

Observacao: a tabela `RefreshToken` ja serve como base para controle de sessoes validas. Para uma v2, ela pode evoluir com `ip`, `user_agent`, `device_id` e `last_used_at` para tela de sessoes ativas do gestor.

## Endpoints principais

### Auth

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`

### Usuarios

- `GET /usuarios`
- `GET /usuarios/:id`
- `GET /usuarios/:id/detalhes`
- `POST /usuarios`
- `PUT /usuarios/:id`
- `DELETE /usuarios/:id`

### Equipamentos

- `GET /equipamentos`
- `GET /equipamentos/:id`
- `GET /equipamentos/:id/detalhes`
- `POST /equipamentos`
- `PUT /equipamentos/:id`
- `DELETE /equipamentos/:id`

### Ordens de servico

- `GET /ordens-servico`
- `GET /ordens-servico/:id`
- `POST /ordens-servico`
- `PATCH /ordens-servico/:id/atribuir-tecnico`
- `PATCH /ordens-servico/:id/assumir`
- `PATCH /ordens-servico/:id/iniciar`
- `PATCH /ordens-servico/:id/status`
- `PATCH /ordens-servico/:id/concluir`
- `GET /ordens-servico/:id/apontamentos`
- `POST /ordens-servico/:id/apontamentos/iniciar`
- `PATCH /ordens-servico/:id/apontamentos/finalizar`

### Historico, dashboard e configuracoes

- `GET /historico-os`
- `GET /historico-os/:id`
- `GET /historico-os/ordem-servico/:osId`
- `GET /historico-os/usuario/:usuarioId`
- `GET /dashboard`
- `GET /configuracoes/prazo-atendimento`
- `PUT /configuracoes/prazo-atendimento/:prioridade`
- `GET /health`

## Regras de negocio

- usuario inativo nao autentica
- email e matricula devem ser unicos
- matricula de usuario pode ser gerada automaticamente
- codigo de equipamento pode ser gerado automaticamente
- equipamento inativo nao recebe nova O.S.
- solicitante autenticado e o autor da O.S.
- tecnico atribuido deve ser ativo e possuir perfil `TECNICO`
- tecnico pode assumir O.S. aberta e sem responsavel
- O.S. concluida ou cancelada nao pode ser alterada
- cancelamento e restrito a perfil autorizado
- O.S. nao pode ser concluida com apontamento aberto
- acoes importantes da O.S. geram historico
- exclusao de usuario e equipamento e logica
- prazos de atendimento sao definidos por prioridade
- status de prazo concluido preserva se a conclusao ocorreu dentro ou fora do prazo
- operacoes criticas usam transacao

## Variaveis de ambiente

Principais:

- `PORT`
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASS`
- `DB_NAME`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `DB_LOGGING`
- `NODE_ENV`
- `DISABLE_RATE_LIMIT` opcional para carga/teste controlado

Consulte tambem [`SETUP.md`](./SETUP.md).

## Desenvolvimento

```bash
npm install
docker compose up -d postgres
npm run db:migrate
npm run db:seed
npm run dev
```

API local:

```text
http://localhost:9090
```

No compose atual, o Postgres fica publicado em `127.0.0.1:5433` e o PgAdmin em `127.0.0.1:8080`.

## Docker

```bash
docker compose up -d --build
```

Servicos principais:

- API: `127.0.0.1:${PORT}`
- Postgres: `127.0.0.1:5433`
- PgAdmin: `127.0.0.1:8080`

## Scripts

- `npm run dev`: sobe API em desenvolvimento
- `npm run build`: compila TypeScript
- `npm start`: executa build compilado
- `npm run db:migrate`: aplica migrations
- `npm run db:seed`: popula dados base
- `npm run db:seed:ordens -- 200`: gera massa adicional de O.S.
- `npm test`: alias para unitarios
- `npm run test:unit`: executa testes unitarios
- `npm run test:integration:jest`: integracao com banco ja disponivel
- `npm run test:integration:docker`: sobe Postgres de teste, migra, testa e derruba
- `npm run load:smoke`: carga rapida com k6 local
- `npm run load:steady`: carga estavel com k6 local
- `npm run load:spike`: pico de carga com k6 local

## Testes

### Build

```bash
npm run build
```

### Unitarios

```bash
npm run test:unit
```

Ultima validacao local: `103` testes unitarios passando.

### Integracao com Docker

```bash
npm run test:integration:docker
```

Ultima validacao local: `87` testes de integracao passando.

### Carga com k6 via Docker

Sem instalar k6 na maquina:

```bash
docker run --rm --network host \
  -e BASE_URL=http://localhost:9090 \
  -e LOGIN_EMAIL=supervisor@seed.local \
  -e LOGIN_SENHA=seed123 \
  -v "$PWD/load-tests:/scripts" \
  grafana/k6:latest run /scripts/smoke.js
```

Para medir capacidade real sem o rate limit bloquear o cenario, suba uma instancia de carga controlada:

```bash
PORT=9091 NODE_ENV=load DISABLE_RATE_LIMIT=true node dist/src/server.js
```

Depois rode o k6 apontando para `http://localhost:9091`.

Ultima validacao local:

- `smoke`: 0% falhas, p95 ~138ms
- `steady`: 0% falhas com rate limit desativado, p95 ~15ms
- `spike`: 0% falhas com 40 VUs, p95 ~291ms

## Observacoes

- A API usa migrations, nao `synchronize`.
- O dashboard e agregado no backend.
- O `.dockerignore` e necessario para reduzir contexto de build e evitar envio de `node_modules`, `.env`, testes e arquivos que nao entram na imagem.
- O rate limit protege a API em uso normal; em carga controlada ele pode ser desativado por variavel de ambiente.
