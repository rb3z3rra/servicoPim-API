import express from "express";
import { appDataSource } from "./src/database/appDataSource.js";
import { usuarioRoutes } from "./src/routes/usuario.routes.js";
import { equipamentoRoutes } from "./src/routes/equipamento.routes.js";
import { ordemServicoRoutes } from "./src/routes/ordemServico.routes.js";
import { authRoutes } from "./src/routes/auth.routes.js";
import { errorMiddleware } from "./src/middleware/errorMiddleware.js";


console.log("SERVER ATUAL CARREGADO");

const app = express();


app.use(express.json());

app.use("/auth", authRoutes);
app.use("/usuarios", usuarioRoutes);
app.use("/equipamentos", equipamentoRoutes);
app.use("/ordens-servico", ordemServicoRoutes);
app.get("/teste", (req, res) => {
  res.send("mudou");
});


app.use(errorMiddleware);



const PORT = 9090;
appDataSource.initialize()


  .then(() => {
    console.log("Banco conectado com sucesso!");

    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Erro ao conectar no banco:", error);
  });