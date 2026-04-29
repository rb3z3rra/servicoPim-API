import request from "supertest";
import bcrypt from "bcryptjs";
import { Like } from "typeorm";
import { app } from "../../src/server.js";
import { appDataSource } from "../../src/database/appDataSource.js";
import { Usuario } from "../../src/entities/Usuario.js";
import { Perfil } from "../../src/types/usr_perfil.js";
import { Prioridade } from "../../src/types/os_prioridade.js";

let gestorToken: string;
let supervisorToken: string;

async function criarUsuarioELogin(
  nome: string,
  email: string,
  perfil: Perfil,
  matricula: string
): Promise<string> {
  const repo = appDataSource.getRepository(Usuario);
  await repo.delete({ email });

  const senhaHash = await bcrypt.hash("senha123", 10);
  await repo.save({
    nome,
    email,
    matricula,
    senha_hash: senhaHash,
    perfil,
    setor: "Gestão",
    ativo: true,
  });

  const res = await request(app)
    .post("/auth/login")
    .send({ email, senha: "senha123" });

  return res.body.accessToken;
}

describe("Testes de Integração - Configuração de Prazo de Atendimento", () => {
  beforeAll(async () => {
    if (!appDataSource.isInitialized) {
      await appDataSource.initialize();
      await appDataSource.runMigrations();
    }

    gestorToken = await criarUsuarioELogin(
      "Gestor Prazo",
      "gestor-prazo-rt@teste.com",
      Perfil.GESTOR,
      "PRAZO-GES-001"
    );
    supervisorToken = await criarUsuarioELogin(
      "Supervisor Prazo",
      "supervisor-prazo-rt@teste.com",
      Perfil.SUPERVISOR,
      "PRAZO-SUP-001"
    );
  });

  afterAll(async () => {
    if (appDataSource.isInitialized) {
      const userRepo = appDataSource.getRepository(Usuario);
      await userRepo.delete({ email: Like("%prazo-rt@teste.com") });
      await appDataSource.destroy();
    }
  });

  test("GET /configuracoes/prazo-atendimento - Gestor deve listar as configurações de prazo de atendimento", async () => {
    const response = await request(app)
      .get("/configuracoes/prazo-atendimento")
      .set("Authorization", `Bearer ${gestorToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          prioridade: Prioridade.ALTA,
          horas_limite: expect.any(Number),
        }),
      ])
    );
  });

  test("PUT /configuracoes/prazo-atendimento/:prioridade - Gestor deve atualizar prazo de atendimento", async () => {
    const response = await request(app)
      .put(`/configuracoes/prazo-atendimento/${encodeURIComponent(Prioridade.ALTA)}`)
      .set("Authorization", `Bearer ${gestorToken}`)
      .send({ horas_limite: 12 });

    expect(response.status).toBe(200);
    expect(response.body.prioridade).toBe(Prioridade.ALTA);
    expect(response.body.horas_limite).toBe(12);
    expect(response.body.atualizadoPor).toEqual(
      expect.objectContaining({
        email: "gestor-prazo-rt@teste.com",
      })
    );
  });

  test("PUT /configuracoes/prazo-atendimento/:prioridade - Supervisor não deve alterar prazo de atendimento", async () => {
    const response = await request(app)
      .put(`/configuracoes/prazo-atendimento/${encodeURIComponent(Prioridade.ALTA)}`)
      .set("Authorization", `Bearer ${supervisorToken}`)
      .send({ horas_limite: 10 });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Acesso negado");
  });
});
