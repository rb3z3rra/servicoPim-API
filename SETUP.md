# ⚙️ Guia de Setup e Instalação (Serviço PIM)

Siga este guia prático para colocar o Backend online no seu equipamento local. 

## 📦 1. Pré-Requisitos Padrões
* Você precisará ter o **[Node.js](https://nodejs.org/)** instalado (Recomendamos a versão LTS = `v20.x`)
* Seu pacote de orquestração **[Docker Desktop](https://www.docker.com/)** em segundo plano precisa estar aberto e "Verde".
* O Editor de Texto (VSCode) aberto na pasta RAIZ deste projeto.

---

## 🛠️ 2. Mão na Massa (Start)

### 2.1 Clone e Bibliotecas Iniciais
Se você baixou o projeto do GitHub, ele virá cru (apenas os arquivos fonte, por motivo de redução de banda e peso). Preencha o resto executando no terminal:
```bash
npm install
```

### 2.2 As Chaves da Casa (.env)
A aplicação necessita de configurações de ambiente privadas (senhas do banco, redes e chaves JWT) para iniciar com segurança. 
1. Ache o arquivo `.env.example` na raiz do seu projeto.
2. Copie ele e cole, renomeando a cópia pura e simples para `.env`.
3. Certifique-se de que a variável `DB_HOST` está apontando para o seu objetivo de uso:
   - Se você for programar no modo `DEV`, mude para `DB_HOST=localhost`.
   - Se for apenas subir a imagem compilada, deixe como `DB_HOST=postgres`.

---

## 🏗️ 3. As Duas Formas de Rodar

Escolha a modalidade que melhor atende seu momento como desenvolvedor:

### Opção A: Modo "Hot-Reload" Diário (Desenvolvimento Frequente)
Neste modo, o Docker cuidará apenas da Infraestrutura pesada (Postgres & PgAdmin), enquanto seu Node atuará diretamente na sua máquina usando o pacote super-rápido `tsx`.
Toda vez que você der "Salvar" (`.ts`), o Node se recompilará e recomeçará sozinho.

1. Suba os contêineres do Banco de Dados ocultamente no Docker:
```bash
docker compose up postgres pgadmin -d
```
2. Abra o terminal raiz do VSCode e chame o Observador do projeto:
```bash
npm run dev
```

### Opção B: Modo Container Dist (Homologação ou Produção Exata)
Neste pipeline, utilizamos a nossa arquitetura `Multi-stage Build` esculpida no Dockerfile. O Docker vai compilar o TypeScript, descartar os pesos mortos (`node_modules`) e iniciar um contêiner Linux limpo com os arquivos da pasta `/dist`. Perfeito para testar a entrega no cliente ou Cloud (AWS/Azure).

1. Execute o Build central completo. Ele unirá o Banco de Dados com a nova Build recém-forjada da "app":
```bash
docker compose up --build -d
```

---

## 📡 4. Visualizando Seus Dados

Se você configurou e levantou o projeto e viu `"Servidor rodando na porta 9090"` no terminal, seu sistema está 100% no ar!

📌 **Lendo o Banco de Dados Fisicamente (PgAdmin):** 
1. Acesse `http://localhost:5050` no seu navegador.
2. Faça login com o email padrão (normalmente `admin@admin.com`) e a senha do docker-compose (`admin`).
3. Adicione e conecte um "New Server", apontando o nome para o hostname `postgres` e o usuário/senha estabelecido no seu arquivo `.env`.

> 💡 **Dica de Testes:** Para fazer Requisições na API HTTP recém-nascida, busque criar um Workspace local no **Postman** e enviar JSONs para `http://localhost:9090`. Se tiver dúvidas sobre a estrutura de *Body*, consulte nossa documentação auxiliar de rotas.
