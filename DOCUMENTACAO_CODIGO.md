# 📚 Manual Técnico Detalhado: Entendendo o Serviço PIM

Este documento descreve, linha por linha (ou em blocos vitais), como as camadas lógicas deste projeto se comunicam. Nosso Backend foi construído sob uma **Arquitetura de Software em Camadas (Layered Architecture)**. 

A ideia dessa arquitetura é que cada pedaço de código tenha uma única responsabilidade. Vamos entender o caminho que um dado faz desde a Internet até o nosso banco de dados.

---

## 1. O Ponto de Partida: `server.ts`

Tudo começa no arquivo da raiz, o coração da aplicação. 

```typescript
import "express-async-errors"; // 1. Permite capturar erros em rotas await sem o 'try/catch'
import express from "express"; // 2. O servidor web base
import { appDataSource } from "./src/database/appDataSource.js"; // 3. A conexão com o Postgres
import dotenv from "dotenv"; // 4. Leitor de .env (senhas não ficam no código)

// Instanciando e ligando middlewares primários
const app = express();
app.use(express.json()); // 5. Ensina o servidor a entender textos no formato JSON

// Importação das rotas
import { usuarioRoutes } from "./src/routes/usuario.routes.js";
import { authRoutes } from "./src/routes/auth.routes.js";
import { errorMiddleware } from "./src/middlewares/errorMiddleware.js";

// Conectando o banco antes de liberar o acesso à internet
appDataSource.initialize()
  .then(() => {
    // 6. Só acorda o servidor se o banco disser "Estou vivo!"
    app.listen(process.env.PORT, () => console.log("Servidor rodando!"));
  });

// Registrando Caminhos da Internet (Endpoints)
app.use("/auth", authRoutes); // Ex: http://localhost:9090/auth/login
app.use("/usuarios", usuarioRoutes); 

// O Porteiro de Erros (Sempre o último "use")
app.use(errorMiddleware); // 7. Tudo que explodir no servidor cai aqui
```

---

## 2. A Camada de Validação (`middlewares/validarBody.ts` e `Zod`)

Antes da informação sequer tocar na inteligência do sistema, precisamos garantir que ela é limpa. Por isso criamos o `validarBody.ts` usando o Zod.

```typescript
export function validarBody(schema: ZodSchema) {
  // 1. Retornamos uma função middleware (Interceptador) do Express
  return (req: Request, res: Response, next: NextFunction) => {
    
    // 2. Compara o "Body" que chegou da Internet com as regras do Zod
    const result = schema.safeParse(req.body); 

    if (!result.success) {
      // 3. Se a senha for curta, ou o e-mail não tiver "@", devolve 400 (Bad Request)
      return res.status(400).json({
        message: "Dados inválidos",
        errors: result.error.flatten().fieldErrors, // Mostra o erro exato pro usuário
      });
    }

    // 4. Se passou, injeta os dados validados de volta e chama o "Próximo Passo"
    req.body = result.data;
    next();
  };
}
```

---

## 3. O Caminho Feliz na Prática: Fluxo de Login

### A Rota (`routes/auth.routes.ts`)
A porta de entrada. Recebeu um "POST" em "/login", redireciona para a recepção (o Controller).
```typescript
authRoutes.post("/login", (req, res) => authController.login(req, res));
```

### A Recepção (`controllers/AuthController.ts`)
O Controller não sabe como conectar no banco nem como verificar senhas. A função dele é **apenas pegar os dados (req.body) e passar para os engenheiros (Services)**.
```typescript
async login(req: Request, res: Response): Promise<Response> {
    // 1. Envia email e senha para a fábrica de login (AuthService) e espera
    const result = await authService.login(req.body);
    
    // 2. Pega o resultado (O token gerado) e devolve para o Postman/Front-End
    return res.status(200).json(result);
}
```

### O Engenheiro do Banco (`services/AuthService.ts`)
Aqui mora a "Regra de Negócio" pesada. É aqui que o dinheiro da empresa é ganho.
```typescript
async login(data: AuthDTO) {
    const { email, senha } = data;

    // 1. Vai no Postgres (UserRepo) e busca alguém com este email exato
    const usuario = await this.userRepo.findOne({ where: { email } });

    // 2. Proteção: Se não achar, "Chuta" um AppError. (O MiddleWare de erro pega no ar)
    if (!usuario) {
      throw new AppError("E-mail ou senha incorretos", 401); 
    }

    // 3. Descriptografa. O bcrypt compara o Hash do Banco com a senha digitada 'senhaForte123'
    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaValida) {
      throw new AppError("E-mail ou senha incorretos", 401);
    }

    // 4. Estando perfeito, cria um Crachá Digital (Access Token) válido por 1 dia
    const token = jwt.sign(
      { id: usuario.id, perfil: usuario.perfil }, // O que o Crachá diz
      process.env.JWT_SECRET as string,           // O Carimbo de segurança (Assinatura)
      { expiresIn: "1d" }                         // Validade
    );

    // 5. Devolve o Crachá para o Controller entregar pro Postman
    return { usuario, token };
}
```

---

## 4. Gerenciamento Global de Erros (`errorMiddleware.ts`)

E o que acontece se lá em cima no passo 2 o `AuthService` fizer o `throw new AppError`? O Servidor desliga na cara do usuário igual o Tomcat antigamente? **NÃO!**

Por causa da bilbioteca `express-async-errors`, a "bomba" (exceção) vai voar livre pelo servidor, passar reto pelo router e cair aqui no final `server.ts`:

```typescript
export function errorMiddleware(
  error: Error, req: Request, res: Response, next: NextFunction
) {
  
  // 1. Verificamos se o erro foi Disparado Propositalmente por nós (AppError)
  if (error instanceof AppError) {
    // 2. Se fomos nós que geramos (ex: "Senha Errada com código 401"), devolve elegantermente:
    return res.status(error.statusCode).json({
      status: "error",
      message: error.message,
    });
  }

  // 3. Se não fomos nós... Erro catastrófico, o banco caiu, sintaxe JavaScript quebrada, chave faltando.
  // Protegemos a cara da API escondendo o log feio do usuário e devolvemos só Status 500
  console.error("🔥 ERRO INTERNO DO SERVIDOR: ", error); // Fica na tela preta do programador
  return res.status(500).json({
    status: "error",
    message: "Internal server error",
  });
}
```

### 🎯 Resumo do Ciclo de Vida:
1. `Internet (Front/Postman)` Manda JSON na Rota (`auth.routes`).
2. `ValidarBody (Zod)` Lê o JSON. Se estiver mal formatado, chuta de volta com `Status 400`.
3. `Controller` Pega os dados limpos e joga no colo do `Service`.
4. `Service` Avalia, calcula Hash, consulta Banco e Toma Decisão (Cria Tokens ou Deleta).
5. Se uma decisão der ruim (`Senha falsa, Sem Estoque`), ele vomita um `AppError`.
6. O `ErrorMiddleware` limpa o vômito e dá uma resposta Bonitinha pro Front-End.
7. O Fluxo recomeça.
