# ServicoPIM API

API REST do sistema de gestao de ordens de servico de manutencao do projeto ServicoPIM.

## Visao geral

O backend concentra:

- autenticacao
- autorizacao por perfil
- regras de negocio
- persistencia
- auditoria
- testes unitarios e de integracao

Stack principal:

- `Node.js`
- `TypeScript`
- `Express 5`
- `TypeORM`
- `PostgreSQL`
- `Zod`
- `JWT`

## Modulos principais

- `Autenticacao`
- `Usuarios`
- `Equipamentos`
- `Ordens de Servico`
- `Historico de O.S.`
- `Apontamentos de Trabalho`

## Perfis do sistema

- `SOLICITANTE`
  - cria ordens de servico
  - visualiza apenas as proprias O.S.

- `TECNICO`
  - assume O.S. abertas disponiveis
  - inicia execucao
  - atualiza status da propria fila
  - registra apontamentos
  - conclui O.S. sob sua responsabilidade

- `SUPERVISOR`
  - cria e gerencia usuarios
  - cria e gerencia equipamentos
  - atribui ou transfere tecnico
  - cancela O.S.
  - acessa historico global e dashboard consolidado

## Seguranca e sessao

O backend usa:

- `accessToken` JWT de curta duracao
- `refreshToken` em cookie `HttpOnly`
- rotacao de refresh token
- revogacao server-side de refresh token
- `helmet`
- `express-rate-limit`
- validacao de entrada com `Zod`
- controle de acesso com `ensureAuth` e `ensureRole`

Importante:

- logout nao apenas limpa o cookie, ele tambem revoga a sessao no servidor
- refresh tokens sao armazenados no banco em formato rastreavel e comparados por hash

## Entidades atuais

- `Usuario`
- `Equipamento`
- `OrdemServico`
- `HistoricoOS`
- `ApontamentoOS`
- `RefreshToken`

## Estrutura do projeto

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
```

Arquivos centrais:

- `src/app.ts`
  monta middlewares, headers, rate limit e rotas

- `src/server.ts`
  inicializa banco, executa migrations e sobe a API

- `src/database/appDataSource.ts`
  configura datasource, entidades e migrations

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

### Ordens de Servico

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

### Historico e dashboard

- `GET /historico-os`
- `GET /historico-os/:id`
- `GET /historico-os/ordem-servico/:osId`
- `GET /historico-os/usuario/:usuarioId`
- `GET /dashboard`
- `GET /health`

## Regras de negocio relevantes

- usuario inativo nao autentica
- email e matricula devem ser unicos
- equipamento inativo nao recebe nova O.S.
- solicitante autenticado e o autor da O.S.
- tecnico so pode ser atribuido se for ativo e possuir perfil `TECNICO`
- tecnico pode assumir O.S. aberta e sem responsavel
- O.S. concluida ou cancelada nao pode ser alterada
- apenas supervisor pode cancelar O.S.
- O.S. nao pode ser concluida com apontamento aberto
- acoes importantes da O.S. geram historico
- exclusao de usuario e equipamento e logica
- campos administrativos de usuario sao restritos ao supervisor

## Variaveis de ambiente

Principais variaveis esperadas:

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

Consulte tambem:

- [`SETUP.md`](./SETUP.md)

## Como executar localmente

### 1. Dependencias

```bash
npm install
```

### 2. Subir banco

```bash
docker compose up -d postgres
```

O Postgres fica acessivel para a API dentro da rede Docker do projeto. No compose atual ele nao e publicado externamente por padrao.

### 3. Rodar migrations

```bash
npm run db:migrate
```

### 4. Subir API

```bash
npm run dev
```

API local:

```text
http://localhost:9090
```

## Como executar tudo em Docker

```bash
docker compose up -d --build
```

No compose atual:

- a API fica publicada em `127.0.0.1:${PORT}`
- o PgAdmin fica restrito a `127.0.0.1:8080`
- o Postgres nao e exposto externamente por padrao

## Seeds

### Seed base

Cria dados de demonstracao controlados:

```bash
npm run db:seed
```

### Seed complementar de O.S.

Gera massa adicional usando os dados atuais:

```bash
npm run db:seed:ordens -- 200
```

## Scripts

- `npm run dev`
  sobe a API em modo desenvolvimento

- `npm run build`
  compila o projeto

- `npm start`
  executa a versao compilada

- `npm run db:migrate`
  aplica migrations no banco configurado

- `npm run db:seed`
  popula dados base

- `npm run db:seed:ordens -- 200`
  gera massa de ordens

- `npm test`
  alias para testes unitarios

- `npm run test:unit`
  roda a suite unitaria

- `npm run test:integration:jest`
  roda integracao assumindo banco de teste ja disponivel

- `npm run test:integration:docker`
  sobe Postgres de teste, aplica migrations, roda integracao e derruba o ambiente

## Como testar a API

### 1. Build

Valida compilacao:

```bash
npm run build
```

### 2. Testes unitarios

Cobrem services, auth, middlewares e regras isoladas:

```bash
npm run test:unit
```

### 3. Testes de integracao com Docker

Esse e o fluxo recomendado porque ja sobe o banco correto automaticamente:

```bash
npm run test:integration:docker
```

O script faz isto:

1. sobe `postgres-test` via `docker-compose.test.yml`
2. carrega `.env.test`
3. aplica `migrations`
4. executa Jest de integracao
5. derruba o ambiente de teste

### 4. Testes de integracao com banco ja disponivel

Se voce ja tiver um banco de teste pronto e configurado:

```bash
npm run test:integration:jest
```

## Estado atual de qualidade

Validacoes mais importantes atualmente cobertas:

- compilacao da API
- testes unitarios
- testes de integracao com banco real
- revogacao de refresh token
- rotacao de sessao
- autorizacao por perfil
- regras de O.S.

## Observacoes de arquitetura

- a API usa `migrations`, nao `synchronize`
- o refresh token e revogavel server-side por meio da entidade `RefreshToken`
- o logout invalida a sessao atual no backend
- operacoes criticas de O.S. usam transacao
- respostas autenticadas usam `no-store`
- o dashboard e agregado no backend
- dependencias de producao foram auditadas e os `overrides` atuais corrigem as vulnerabilidades reportadas
