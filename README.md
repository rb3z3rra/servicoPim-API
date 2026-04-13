<p align="center">
  <img src="https://img.shields.io/badge/Node.js-20.x-green?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js version" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Express-5.x-lightgrey?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-blue?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
</p>

# Serviço PIM - API

API REST para abertura, acompanhamento e encerramento de ordens de serviço de manutenção industrial.

## Sobre o Projeto
O backend foi estruturado em Node.js, TypeScript, Express e PostgreSQL com TypeORM. A API usa JWT para autenticação, Zod para validação de entrada e histórico de mudanças para auditoria de ordens de serviço.

Principais melhorias desta versão:
- autenticação unificada com `JWT_ACCESS_SECRET` e `JWT_REFRESH_SECRET`
- inicialização da aplicação separada de bootstrap HTTP
- migrations versionadas no lugar de `synchronize`
- transações nas operações críticas de ordem de serviço
- desativação lógica de usuários em vez de exclusão física
- suíte integrada preparada para subir Postgres isolado via Docker

## O que a API faz
- autentica usuários com `JWT`
- controla acesso por perfil: `SOLICITANTE`, `TÉCNICO` e `SUPERVISOR`
- gerencia usuários com `email` e `matricula` únicos
- gerencia equipamentos
- cria, lista, busca, atribui técnico, atualiza status e conclui ordens de serviço
- registra histórico automático das mudanças relevantes da OS
- expõe `GET /health` para verificação de disponibilidade

## Perfis
- `SUPERVISOR`: administra usuários e equipamentos, atribui técnico e pode atuar nas OS
- `SOLICITANTE`: abre ordens de serviço
- `TÉCNICO`: atualiza status e conclui ordens de serviço

## Scripts
- `npm run dev`: sobe a API em modo desenvolvimento
- `npm run build`: compila o projeto
- `npm start`: executa a versão compilada em `dist/`
- `npm run db:migrate`: aplica migrations no banco configurado no ambiente atual
- `npm test`: roda a suíte unitária
- `npm run test:unit`: roda explicitamente a suíte unitária
- `npm run test:integration:jest`: roda a suíte integrada usando o banco já disponível no ambiente de teste
- `npm run test:integration:docker`: sobe Postgres de teste, aplica migrations e executa a suíte integrada

## Configuração
Variáveis principais:
- `PORT`
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASS`
- `DB_NAME`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `DB_LOGGING`

Exemplo completo em [`.env.example`](./.env.example).

## Como subir o projeto
Você pode usar dois modos:

### 1. Banco no Docker + API local
Use este modo para desenvolvimento e testes manuais no Postman:

```bash
docker compose up -d postgres pgadmin
npm run db:migrate
npm run dev
```

Nesse cenário:
- Postgres fica exposto em `localhost:5433`
- a API local sobe em `http://localhost:9090`
- o PgAdmin fica em `http://localhost:8080`

### 2. Tudo por Docker
Use este modo se quiser rodar a API no container:

```bash
docker compose up --build -d
```

Importante:
- não rode `docker compose up -d` com a API no container e `npm run dev` local ao mesmo tempo
- os dois tentam usar a mesma porta `9090`

## Primeiro acesso
`POST /usuarios` exige autenticação de `SUPERVISOR`, então o primeiro supervisor precisa existir antes.

Fluxo recomendado:
- criar o primeiro `SUPERVISOR` manualmente no banco
- preencher `nome`, `email`, `matricula`, `senha_hash`, `perfil`, `setor` e `ativo`
- fazer login em `POST /auth/login`
- usar o `accessToken` para o restante das rotas protegidas

## Fluxo de Usuários
- `POST /usuarios` recebe `senha` e `matricula`, não `senha_hash`
- `DELETE /usuarios/:id` desativa o usuário (`ativo=false`) para preservar auditoria
- login e refresh rejeitam usuários inativos

## Fluxo de Ordens de Serviço
- `POST /ordens-servico` usa o usuário autenticado como solicitante
- `GET /ordens-servico` aceita filtros opcionais por `status` e `prioridade`
- o número da OS é gerado automaticamente pelo banco no formato `OS-0001`
- criação, atribuição, atualização de status e conclusão geram histórico automaticamente

## Testes
- `npm test`: unitários
- `npm run test:integration:docker`: integrais com banco isolado via Docker
- `testes-api.http`: roteiro de teste manual da API

Observações sobre os testes:
- os unitários não dependem de banco real
- os integrados usam `.env.test` e banco de teste em `localhost:5434`
- para os integrados funcionarem, o Docker precisa estar acessível na máquina

## Endpoints úteis
- o healthcheck da aplicação está em `GET /health`
- API local: `http://localhost:9090`
- PgAdmin do `docker-compose.yml`: `http://localhost:8080`

## Referências do projeto
- instruções detalhadas de setup e execução estão em [SETUP.md](./SETUP.md)
- roteiro de testes manuais está em [testes-api.http](./testes-api.http)
