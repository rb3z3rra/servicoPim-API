# Guia Prático: Testando a API no Postman

Agora que o servidor está rodando, vamos cadastrar no Postman as requisições que testam exatamente o que acabamos de configurar com o `AppError` e o `Zod`. A sua URL base para todos os testes será `http://localhost:9090` (ou a porta que estiver no `.env`).

---

## 🏗️ 1. Criar um Usuário (`POST /usuarios`)

Para testar como seu sistema valida e insere os dados no banco usando as regras do **Zod**, cadastre essa requisição.

Vá na aba do Postman, selecione o método `POST`, coloque a URL `http://localhost:9090/usuarios`. Na aba **Body**, selecione **raw** e mude a formatação para **JSON**.

### 🟢 Caminho Feliz (Status 201 Created)
Insira todos os dados perfeitamente corretos. Note que o banco usará o *bcrypt* para converter essa `senha_hash` antes de salvar.

```json
{
  "nome": "João da Silva",
  "email": "joao@indt.com",
  "senha_hash": "senhaForte123",
  "perfil": "TECNICO",
  "setor": "TI"
}
```

### 🔴 Caminho Triste (Status 400 Bad Request)
Vamos forçar o `ZodError` aparecer para vermos o seu novo `errorMiddleware` em ação. Vamos enviar um email inválido e esquecer a senha.

```json
{
  "nome": "Zé",
  "email": "email_invalido_sem_arroba",
  "perfil": "ADMIN",
  "setor": "TI"
}
```
*Nesse teste, a API deve devolver um bloqueio detalhando qual campo falhou na validação.*

---

## 🔐 2. Fazer Login (`POST /auth/login`)

Aqui testamos a lógica do `AuthService` que mexemos hoje.

Crie uma nova requisição `POST` com a URL `http://localhost:9090/auth/login`.

### 🟢 Caminho Feliz (Status 200 OK)
```json
{
  "email": "joao@indt.com",
  "senha": "senhaForte123"
}
```
*Se der certo, você receberá de volta os dados do João, o `token` (Access) e o famoso `refreshToken`.* Copie esse `refreshToken` para o próximo passo!

### 🔴 Caminho Triste (Status 401 Unauthorized)
Vamos tentar logar com a senha errada para ver se o seu `throw new AppError` funciona.
```json
{
  "email": "joao@indt.com",
  "senha": "senhaERRADAA"
}
```

---

## ♻️ 3. Renovar o Token (`POST /auth/refresh`)

Por fim, a funcionalidade do Refresh Token que finalizou a sua Sprint! 

Crie um `POST` para `http://localhost:9090/auth/refresh`.

### 🟢 Caminho Feliz (Status 200 OK)
Cole aqui aquele `refreshToken` bem longo que você recebeu no Caminho Feliz do Login:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsIn..."
}
```
*O retorno será uma nova roupagem de Access Token.*

### 🔴 Caminho Triste (Status 401 Unauthorized)
Mande o objeto vazio ou adultere uma letrinha no final da Hash do token:
```json
{
  "refreshToken": "TokenFalsificado123"
}
```

> **Dica Postman:** Crie uma *Collection* (Pastinha) no canto esquerdo com o nome "Aulas INDT - Serviço Pim" e vá salvando cada aba lá dentro (CTRL+S). Ficará muito mais fácil de trabalhar nas próximas Sprints!
