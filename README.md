<p align="center">
  <img src="https://img.shields.io/badge/Node.js-20.x-green?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js version" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Express-5.x-lightgrey?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-blue?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
</p>

# 🏭 Serviço PIM - API

> API RESTful para um sistema web focado na abertura, acompanhamento e encerramento de Ordens de Serviço (O.S) de manutenção industrial.

## 📋 Sobre o Projeto
O **Serviço PIM** foi desenhado com foco no setor industrial, fornecendo a infraestrutura de Backend necessária para que técnicos, solicitantes e supervisores gerenciem todo o ciclo de vida de equipamentos e tarefas de manutenção de forma segura, rápida e distribuída.

Esta API serve como o coração de todo o ecossistema, garantindo proteção das regras de negócio através de validações baseadas em esquemas (Zod) e autenticação de tráfego com Web Tokens.

---

## 🚀 Principais Features
- **Gestão de Identidade:** Autenticação via JWT com dupla camada (`Access Token` via Bearer auth e `Refresh Token` rotativo) em rotas privadas.
- **Hierarquia e Perfis:** Acesso multi-camada controlado (`SOLICITANTE`, `TECNICO`, `SUPERVISOR`).
- **Ciclo de O.S:** Rotas para abertura, triagem, delegação e fechamento de ordens de serviço.
- **Auditoria de Falhas:** Tratamento global e blindado de exceções HTTP padronizadas via injetores de controle (AppError).
- **Validação de Ponta-a-Ponta:** Entradas do usuário checadas no nível de rede usando a engine do Zod para evitar gargalos no banco.

---

## 🛠️ Stack Tecnológico
A infraestrutura foi construída sobre fundações corporativas modernas:

* **Engine:** [Node.js](https://nodejs.org/) (v20 LTS)
* **Linguagem Principal:** [TypeScript](https://www.typescriptlang.org/)
* **Microsserviço Web:** [Express.js](https://expressjs.com/) (v5)
* **Banco de Dados:** [PostgreSQL](https://www.postgresql.org/) (v16) via [TypeORM](https://typeorm.io/)
* **Segurança e Criptografia:** BcryptJS & JSON Web Tokens (JWT)
* **Validação de Inputs:** Zod
* **Deploy e Orquestração:** Docker & Docker Compose (Multi-stage builds)

---

## ⚙️ Instalação e Execução
Cobrimos em detalhes todos os passos necessários para você rodar o sistema localmente (em Modo de Desenvolvimento) ou para a subida em Servidores de Produção na nuvem num guia separado.

👉 **[Acesse o manual de Instalação no SETUP.md](./SETUP.md)**

---

## 💻 Contribuindo
Este projeto segue padrões rigorosos para a equipe:
* Suporte oficial para **Convencional Commits** nas mensagens de versionamento.
* Fluxo de trabalho baseado em ramificações (Feature branches > Pull Request > Main).

**Autores e Mantenedores do Ecossistema PIM:**
- Patrese Emiron Barbosa de Souza
- Rodrigo Bezerra da Silva
- Daniel Valdivino Silva

