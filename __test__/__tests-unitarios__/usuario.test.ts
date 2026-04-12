import { jest } from "@jest/globals";
import bcrypt from "bcryptjs";
import { UsuarioService } from "../../src/services/UsuarioService.js";
import { Perfil } from "../../src/types/usr_perfil.js";

const userRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
};

const mockDataSource = {
  getRepository: jest.fn(() => userRepo),
};

let usuarioService: UsuarioService;

beforeAll(() => {
  usuarioService = new UsuarioService(mockDataSource as never);
});

beforeEach(() => {
  userRepo.findOne.mockReset();
  userRepo.create.mockReset();
  userRepo.save.mockReset();
  userRepo.find.mockReset();
});

describe("UsuarioService", () => {
  test("lista todos os usuários", async () => {
    userRepo.find.mockResolvedValue([
      { id: "1", nome: "A" },
      { id: "2", nome: "B" },
    ]);

    const result = await usuarioService.getAll();

    expect(result).toHaveLength(2);
  });

  test("retorna usuário por email com seleção esperada", async () => {
    userRepo.findOne.mockResolvedValue({
      id: "user-1",
      nome: "Joao",
      email: "joao@teste.com",
      perfil: Perfil.SOLICITANTE,
      setor: "TI",
      ativo: true,
      created_at: new Date(),
    });

    const result = await usuarioService.getByEmail("joao@teste.com");

    expect(result.email).toBe("joao@teste.com");
    expect(userRepo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: "joao@teste.com" },
      })
    );
  });

  test("falha ao buscar usuário por email inexistente", async () => {
    userRepo.findOne.mockResolvedValue(null);

    await expect(usuarioService.getByEmail("naoexiste@teste.com")).rejects.toThrow(
      "Usuário não encontrado"
    );
  });

  test("falha ao buscar usuário por id inexistente", async () => {
    userRepo.findOne.mockResolvedValue(null);

    await expect(usuarioService.getById("user-404")).rejects.toThrow(
      "Usuário não encontrado"
    );
  });

  test("cria usuario com hash de senha", async () => {
    userRepo.findOne.mockResolvedValue(null);
    userRepo.create.mockImplementation((data) => ({ ...data }));
    userRepo.save.mockImplementation(async (data) => ({
      id: "user-1",
      created_at: new Date(),
      ...data,
    }));

    const result = await usuarioService.createUser({
      nome: "Joao Silva",
      email: "joao@teste.com",
      senha: "senha123",
      perfil: Perfil.SOLICITANTE,
      setor: "TI",
      ativo: true,
    });

    expect(result).toEqual(
      expect.objectContaining({
        nome: "Joao Silva",
        email: "joao@teste.com",
        perfil: Perfil.SOLICITANTE,
      })
    );
    expect(result.senha_hash).not.toBe("senha123");
    await expect(bcrypt.compare("senha123", result.senha_hash)).resolves.toBe(true);
  });

  test("cria usuário aplicando defaults de setor e ativo", async () => {
    userRepo.findOne.mockResolvedValue(null);
    userRepo.create.mockImplementation((data) => ({ ...data }));
    userRepo.save.mockImplementation(async (data) => data);

    const result = await usuarioService.createUser({
      nome: "Sem Defaults Explícitos",
      email: "default@teste.com",
      senha: "senha123",
      perfil: Perfil.SOLICITANTE,
    });

    expect(result.setor).toBeNull();
    expect(result.ativo).toBe(true);
  });

  test("falha ao criar usuario com email duplicado", async () => {
    userRepo.findOne.mockResolvedValue({ id: "existing-user" });

    await expect(
      usuarioService.createUser({
        nome: "Duplicado",
        email: "duplicado@teste.com",
        senha: "senha123",
        perfil: Perfil.SOLICITANTE,
        setor: "TI",
      })
    ).rejects.toThrow("Email já cadastrado");
  });

  test("atualiza senha quando campo senha é enviado", async () => {
    userRepo.findOne
      .mockResolvedValueOnce({
        id: "user-1",
        nome: "Joao",
        email: "joao@teste.com",
        perfil: Perfil.SOLICITANTE,
        setor: "TI",
        ativo: true,
        senha_hash: "hash-antigo",
      })
      .mockResolvedValueOnce(null);
    userRepo.save.mockImplementation(async (data) => data);

    const result = await usuarioService.updateUser("user-1", {
      senha: "novaSenha123",
      setor: "RH",
    });

    expect(result.setor).toBe("RH");
    expect(result.senha_hash).not.toBe("hash-antigo");
    await expect(bcrypt.compare("novaSenha123", result.senha_hash)).resolves.toBe(true);
  });

  test("atualiza email para um valor único", async () => {
    userRepo.findOne
      .mockResolvedValueOnce({
        id: "user-1",
        nome: "Joao",
        email: "joao@teste.com",
        perfil: Perfil.SOLICITANTE,
        setor: "TI",
        ativo: true,
        senha_hash: "hash-antigo",
      })
      .mockResolvedValueOnce(null);
    userRepo.save.mockImplementation(async (data) => data);

    const result = await usuarioService.updateUser("user-1", {
      email: "novo@teste.com",
    });

    expect(result.email).toBe("novo@teste.com");
  });

  test("desativa usuario em vez de remover fisicamente", async () => {
    userRepo.findOne.mockResolvedValue({
      id: "user-1",
      nome: "Joao",
      email: "joao@teste.com",
      perfil: Perfil.SOLICITANTE,
      setor: "TI",
      ativo: true,
    });
    userRepo.save.mockImplementation(async (data) => data);

    await expect(usuarioService.deleteUser("user-1")).resolves.toBeUndefined();
    expect(userRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: "user-1", ativo: false })
    );
  });

  test("falha ao atualizar email para outro já existente", async () => {
    userRepo.findOne
      .mockResolvedValueOnce({
        id: "user-1",
        nome: "Joao",
        email: "joao@teste.com",
        perfil: Perfil.SOLICITANTE,
        setor: "TI",
        ativo: true,
        senha_hash: "hash-antigo",
      })
      .mockResolvedValueOnce({
        id: "user-2",
        email: "maria@teste.com",
      });

    await expect(
      usuarioService.updateUser("user-1", { email: "maria@teste.com" })
    ).rejects.toThrow("Email já cadastrado");
  });
});
