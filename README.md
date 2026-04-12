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

## Scripts
- `npm run dev`: sobe a API em modo desenvolvimento
- `npm run build`: compila o projeto
- `npm run db:migrate`: aplica migrations no banco configurado no ambiente atual
- `npm test`: roda a suíte unitária
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

## Fluxo de Usuários
- `POST /usuarios` recebe `senha`, não `senha_hash`
- `DELETE /usuarios/:id` desativa o usuário (`ativo=false`) para preservar auditoria
- login e refresh rejeitam usuários inativos

## Observações
- o healthcheck da aplicação está em `GET /health`
- o PgAdmin do `docker-compose.yml` está exposto em `http://localhost:8080`
- instruções detalhadas de setup e execução estão em [SETUP.md](./SETUP.md)
