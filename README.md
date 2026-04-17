<p align="center">
  <img src="https://img.shields.io/badge/Node.js-20%2B-green?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js version" />
  <img src="https://img.shields.io/badge/TypeScript-6.x-blue?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Express-5.x-lightgrey?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-blue?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
</p>

# ServiçoPIM API

API REST do sistema de gestão de ordens de serviço de manutenção do projeto ServiçoPIM.

## Visão Geral

O backend concentra autenticação, autorização, regras de negócio, persistência e testes do sistema. Ele foi construído com:

- `Node.js`
- `TypeScript`
- `Express`
- `TypeORM`
- `PostgreSQL`
- `Zod`

O projeto entrega hoje:

- autenticação com `JWT` (`accessToken` e `refreshToken`)
- autorização por perfil
- CRUD de usuários
- CRUD de equipamentos com desativação lógica
- fluxo completo de ordens de serviço
- histórico de auditoria
- apontamentos de trabalho por técnico
- dashboard agregado por perfil
- seeds para ambiente de demonstração
- testes unitários e de integração

## Perfis do sistema

- `SOLICITANTE`
  - abre ordens de serviço
  - acompanha apenas as próprias solicitações

- `TÉCNICO`
  - pode assumir O.S. aberta disponível
  - inicia execução
  - atualiza status da O.S. sob sua responsabilidade
  - registra apontamentos de trabalho
  - conclui O.S.
  - vê histórico apenas de O.S. em que é técnico atual ou já apontou trabalho

- `SUPERVISOR`
  - administra usuários e equipamentos
  - atribui ou transfere técnicos
  - cancela O.S.
  - acompanha histórico global
  - acessa dashboard e relatórios gerenciais

## Regras de negócio principais

- a criação de O.S. usa o usuário autenticado como solicitante
- equipamentos inativos não podem receber nova O.S.
- exclusão de equipamento é lógica (`ativo = false`)
- técnico não pode cancelar O.S.
- conclusão exige descrição do serviço
- não é permitido concluir O.S. com apontamento aberto
- não é permitido transferir a O.S. para outro técnico com apontamento aberto
- criação, atribuição, mudança de status, apontamentos e conclusão geram histórico
- o sistema diferencia:
  - tempo até início
  - tempo até conclusão
  - tempo efetivamente trabalhado

## Estrutura do projeto

```text
src/
  config/        -> variáveis de ambiente e helpers
  controllers/   -> camada HTTP
  database/      -> datasource e migrations
  dtos/          -> validações com Zod
  entities/      -> entidades do banco
  errors/        -> AppError
  middleware/    -> auth, role, error handling, validação
  routes/        -> endpoints da API
  scripts/       -> migrations e seeds
  services/      -> regras de negócio
  types/         -> enums e tipos do domínio
```

Arquivos centrais:

- `src/app.ts`
  monta a aplicação Express, middlewares, rate limit e rotas

- `src/server.ts`
  inicializa o banco, aplica migrations e sobe o servidor

- `src/database/appDataSource.ts`
  configura a conexão TypeORM

## Entidades principais

- `Usuario`
- `Equipamento`
- `OrdemServico`
- `HistoricoOS`
- `ApontamentoOS`

## Módulos principais

### Auth

- `POST /auth/login`
- `POST /auth/refresh`

### Usuários

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

### Ordens de Serviço

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

### Histórico e Dashboard

- `GET /historico-os`
- `GET /historico-os/:id`
- `GET /historico-os/ordem-servico/:osId`
- `GET /historico-os/usuario/:usuarioId`
- `GET /dashboard`
- `GET /health`

## Filtros já suportados

### `GET /ordens-servico`

- `status`
- `prioridade`
- `busca`
- `tecnicoId`
- `setor`

### `GET /equipamentos`

- `busca`
- `setor`
- `ativo`
- `comOsAbertas`

### `GET /historico-os`

- `busca`
- `statusNovo`
- `prioridade`
- `usuarioId`
- `osId`
- `dataInicio`
- `dataFim`

## Ambiente

Variáveis principais no `.env`:

- `PORT`
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASS`
- `DB_NAME`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `DB_LOGGING`

Consulte também:

- [`.env.example`](./.env.example)
- [`SETUP.md`](./SETUP.md)

## Como executar

### Banco via Docker + API local

```bash
docker compose up -d postgres pgadmin
npm install
npm run db:migrate
npm run dev
```

Endereços:

- API: `http://localhost:9090`
- PostgreSQL: `localhost:5433`
- PgAdmin: `http://localhost:8080`

### Tudo em Docker

```bash
docker compose up --build -d
```

Evite subir a API local e a API em container ao mesmo tempo, porque ambas usam a mesma porta.

## Seeds e dados de demonstração

### Seed base

Cria usuários, equipamentos, O.S., histórico e apontamentos de demonstração:

```bash
npm run db:seed
```

### Massa de O.S. sobre dados existentes

Gera ordens de serviço usando profissionais e equipamentos já cadastrados, sem apagar os usuários atuais:

```bash
npm run db:seed:ordens -- 200
```

Se nenhum número for informado, o padrão é `200`.

## Scripts

- `npm run dev`
  inicia a API em modo desenvolvimento

- `npm run build`
  compila o projeto

- `npm start`
  executa a versão compilada

- `npm run db:migrate`
  aplica migrations no banco atual

- `npm run db:seed`
  cria seed base controlada

- `npm run db:seed:ordens -- 200`
  gera massa de O.S. em cima dos dados atuais

- `npm test`
  roda a suíte unitária

- `npm run test:unit`
  roda explicitamente os unitários

- `npm run test:integration:jest`
  roda integração usando o banco de teste já disponível

- `npm run test:integration:docker`
  sobe o ambiente de teste, aplica migrations, roda integração e encerra tudo

## Testes

### Unitários

```bash
npm test
```

Cobrem principalmente:

- services
- autenticação
- transições de O.S.
- validações de negócio
- filtros e regras específicas

### Integração

```bash
npm run test:integration:docker
```

Cobrem fluxos ponta a ponta com banco real:

- auth
- usuários
- equipamentos
- ordens de serviço
- histórico
- dashboard

## Observações de arquitetura

- usa `migrations`, não `synchronize`
- erros de negócio usam `AppError`
- autenticação é centralizada em middleware
- o dashboard é agregado no backend para reduzir processamento no frontend
- as respostas autenticadas usam headers de `no-store` para evitar cache indevido por perfil
- o rate limit foi separado entre:
  - login
  - restante da API
