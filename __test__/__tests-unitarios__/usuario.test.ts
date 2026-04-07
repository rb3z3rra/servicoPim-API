import { jest } from '@jest/globals';
import { UsuarioService } from "../../src/services/UsuarioService.js";
import { Usuario } from "../../src/entities/Usuario.js";
import { Perfil } from "../../src/types/usr_perfil.js";
import bcrypt from "bcryptjs";

let usuarioService: UsuarioService;
let mockDataSource: any;

beforeAll(() => {
    mockDataSource = {
        getRepository: jest.fn().mockReturnValue({
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            remove: jest.fn()
        })
    };
    usuarioService = new UsuarioService(mockDataSource);
});

beforeEach(() => {
    jest.clearAllMocks();
});

describe("Testes CRUD de Usuários", () => {

    describe("CREATE - Criar usuários", () => {
        test("Deve criar um novo usuário com sucesso", async () => {
            const newUser = {
                nome: "João Silva",
                email: "joao.silva@email.com",
                senha_hash: "senha123",
                perfil: Perfil.SOLICITANTE,
                setor: "TI",
                ativo: true
            };

            mockDataSource.getRepository().findOne.mockResolvedValue(null);
            mockDataSource.getRepository().create.mockImplementation((data: any) => ({ ...data }));
            mockDataSource.getRepository().save.mockImplementation(async (entity: any) => {
                entity.id = "user-uuid-1";
                entity.created_at = new Date();
                return entity;
            });

            const result = await usuarioService.createUser(newUser as Usuario);

            expect(result).toHaveProperty("id");
            expect(result.nome).toBe("João Silva");
            expect(result.email).toBe("joao.silva@email.com");
            expect(result.perfil).toBe(Perfil.SOLICITANTE);
            expect(result.ativo).toBe(true);
        });

        test("Deve criar múltiplos usuários com IDs únicos", async () => {
            const user1Data = { nome: "Maria Santos", email: "maria@email.com", senha_hash: "senha123", perfil: Perfil.TECNICO, setor: "Manutenção", ativo: true };
            const user2Data = { nome: "Pedro Costa", email: "pedro@email.com", senha_hash: "senha123", perfil: Perfil.SUPERVISOR, setor: "TI", ativo: true };

            mockDataSource.getRepository().findOne.mockResolvedValue(null);
            mockDataSource.getRepository().create.mockImplementation((data: any) => ({ ...data }));
            let userIdCounter = 1;
            mockDataSource.getRepository().save.mockImplementation(async (entity: any) => {
                entity.id = `user-uuid-${++userIdCounter}`;
                entity.created_at = new Date();
                return entity;
            });

            const user1 = await usuarioService.createUser(user1Data as Usuario);
            const user2 = await usuarioService.createUser(user2Data as Usuario);

            expect(user1.id).toBe("user-uuid-2");
            expect(user2.id).toBe("user-uuid-3");
        });

        test("Deve lançar erro ao criar usuário com email já existente", async () => {
            const newUser = {
                nome: "Carlos Oliveira",
                email: "joao.silva@email.com",
                senha_hash: "senha123",
                perfil: Perfil.SOLICITANTE,
                setor: "RH",
                ativo: true
            };

            mockDataSource.getRepository().findOne.mockResolvedValue({ id: "user-uuid-1", email: "joao.silva@email.com" });

            await expect(usuarioService.createUser(newUser as Usuario)).rejects.toThrow("Email já cadastrado");
        });
    });

    describe("READ - Listar usuários", () => {
        test("Deve listar todos os usuários", async () => {
            const mockUsers = [
                { id: "user-uuid-1", nome: "João Silva", email: "joao@email.com", perfil: Perfil.SOLICITANTE, setor: "TI", ativo: true, created_at: new Date() },
                { id: "user-uuid-2", nome: "Maria Santos", email: "maria@email.com", perfil: Perfil.TECNICO, setor: "Manutenção", ativo: true, created_at: new Date() }
            ];

            mockDataSource.getRepository().find.mockResolvedValue(mockUsers);

            const allUsers = await usuarioService.getAll();

            expect(allUsers).toHaveLength(2);
            expect(allUsers[0]).toMatchObject({
                id: "user-uuid-1",
                nome: "João Silva"
            });
        });

        test("Deve retornar array vazio se não houver usuários", async () => {
            mockDataSource.getRepository().find.mockResolvedValue([]);

            const allUsers = await usuarioService.getAll();

            expect(allUsers).toHaveLength(0);
            expect(allUsers).toEqual([]);
        });

        test("Deve buscar usuário por ID existente", async () => {
            const mockUser = { id: "user-uuid-1", nome: "João Silva", email: "joao@email.com", perfil: Perfil.SOLICITANTE, setor: "TI", ativo: true, created_at: new Date() };

            mockDataSource.getRepository().findOne.mockResolvedValue(mockUser);

            const user = await usuarioService.getById("user-uuid-1");

            expect(user).toBeDefined();
            expect(user.id).toBe("user-uuid-1");
            expect(user.nome).toBe("João Silva");
        });

        test("Deve lançar erro ao buscar ID inexistente", async () => {
            mockDataSource.getRepository().findOne.mockResolvedValue(null);

            await expect(usuarioService.getById("invalid-uuid")).rejects.toThrow("Usuário não encontrado");
        });
    });

    describe("UPDATE - Atualizar usuários", () => {
        test("Deve atualizar usuário existente com sucesso", async () => {
            const existingUser = { id: "user-uuid-1", nome: "João Silva", email: "joao@email.com", perfil: Perfil.SOLICITANTE, setor: "TI", ativo: true, created_at: new Date() };
            const updateData = { nome: "João Silva Atualizado", ativo: false };

            mockDataSource.getRepository().findOne.mockResolvedValue(existingUser);
            mockDataSource.getRepository().save.mockImplementation(async (entity: any) => entity);

            const updated = await usuarioService.updateUser("user-uuid-1", updateData);

            expect(updated).toMatchObject({ ...existingUser, ...updateData });
            expect(updated.id).toBe("user-uuid-1");
        });

        test("Deve atualizar apenas campos específicos", async () => {
            const existingUser = { id: "user-uuid-1", nome: "João Silva", email: "joao@email.com", perfil: Perfil.SOLICITANTE, setor: "TI", ativo: true, created_at: new Date() };
            const updateData = { ativo: false };

            mockDataSource.getRepository().findOne.mockResolvedValue(existingUser);
            mockDataSource.getRepository().save.mockImplementation(async (entity: any) => entity);

            const updated = await usuarioService.updateUser("user-uuid-1", updateData);

            expect(updated.ativo).toBe(false);
            expect(updated.nome).toBe("João Silva"); // Mantém o nome original
        });

        test("Deve lançar erro ao tentar atualizar ID inexistente", async () => {
            mockDataSource.getRepository().findOne.mockResolvedValue(null);

            await expect(usuarioService.updateUser("invalid-uuid", { nome: "Teste" })).rejects.toThrow("Usuário não encontrado");
        });

        test("Deve lançar erro ao tentar atualizar para email já existente", async () => {
            const existingUser = { id: "user-uuid-1", nome: "João Silva", email: "joao@email.com", perfil: Perfil.SOLICITANTE, setor: "TI", ativo: true, created_at: new Date() };
            const updateData = { email: "maria@email.com" };

            mockDataSource.getRepository().findOne
                .mockResolvedValueOnce(existingUser) // para getById
                .mockResolvedValueOnce({ id: "user-uuid-2", email: "maria@email.com" }); // para verificar duplicidade

            await expect(usuarioService.updateUser("user-uuid-1", updateData)).rejects.toThrow("Email já cadastrado");
        });
    });

    describe("DELETE - Remover usuários", () => {
        test("Deve deletar usuário existente com sucesso", async () => {
            const existingUser = { id: "user-uuid-1", nome: "João Silva", email: "joao@email.com", perfil: Perfil.SOLICITANTE, setor: "TI", ativo: true, created_at: new Date() };

            mockDataSource.getRepository().findOne.mockResolvedValue(existingUser);
            mockDataSource.getRepository().remove.mockResolvedValue(undefined);

            await expect(usuarioService.deleteUser("user-uuid-1")).resolves.toBeUndefined();

            expect(mockDataSource.getRepository().remove).toHaveBeenCalledWith(existingUser);
        });

        test("Deve lançar erro ao tentar deletar ID inexistente", async () => {
            mockDataSource.getRepository().findOne.mockResolvedValue(null);

            await expect(usuarioService.deleteUser("invalid-uuid")).rejects.toThrow("Usuário não encontrado");
        });

        test("Deve permitir deletar múltiplos usuários sequencialmente", async () => {
            const user1 = { id: "user-uuid-1", nome: "João Silva", email: "joao@email.com", perfil: Perfil.SOLICITANTE, setor: "TI", ativo: true, created_at: new Date() };
            const user2 = { id: "user-uuid-2", nome: "Maria Santos", email: "maria@email.com", perfil: Perfil.TECNICO, setor: "Manutenção", ativo: true, created_at: new Date() };

            mockDataSource.getRepository().findOne
                .mockResolvedValueOnce(user1)
                .mockResolvedValueOnce(user2);
            mockDataSource.getRepository().remove.mockResolvedValue(undefined);

            await expect(usuarioService.deleteUser("user-uuid-1")).resolves.toBeUndefined();
            await expect(usuarioService.deleteUser("user-uuid-2")).resolves.toBeUndefined();

            expect(mockDataSource.getRepository().remove).toHaveBeenCalledTimes(2);
        });
    });

    describe("Hash de Senha (Bcrypt)", () => {
        test("Deve gerar hash da senha ao criar usuário", async () => {
            const senhaOriginal = "minhaSenha123";
            const newUser = {
                nome: "Teste Hash",
                email: "hash@email.com",
                senha_hash: senhaOriginal,
                perfil: Perfil.SOLICITANTE,
                setor: "TI",
                ativo: true
            };

            mockDataSource.getRepository().findOne.mockResolvedValue(null);
            mockDataSource.getRepository().create.mockImplementation((data: any) => ({ ...data }));
            mockDataSource.getRepository().save.mockImplementation(async (entity: any) => {
                entity.id = "user-uuid-hash";
                entity.created_at = new Date();
                return entity;
            });

            const result = await usuarioService.createUser(newUser as Usuario);

            // A senha salva NÃO deve ser a original (deve ter sido hasheada)
            expect(result.senha_hash).not.toBe(senhaOriginal);
            // O hash gerado deve ser válido com bcrypt
            const senhaConfere = await bcrypt.compare(senhaOriginal, result.senha_hash);
            expect(senhaConfere).toBe(true);
        });

        test("Deve gerar hashes diferentes para a mesma senha (salt)", async () => {
            const senha = "mesmaSenha123";

            mockDataSource.getRepository().findOne.mockResolvedValue(null);
            mockDataSource.getRepository().create.mockImplementation((data: any) => ({ ...data }));

            let savedEntities: any[] = [];
            mockDataSource.getRepository().save.mockImplementation(async (entity: any) => {
                entity.id = `user-uuid-${savedEntities.length + 1}`;
                entity.created_at = new Date();
                savedEntities.push({ ...entity });
                return entity;
            });

            const user1Data = { nome: "User 1", email: "user1@email.com", senha_hash: senha, perfil: Perfil.SOLICITANTE, setor: "TI", ativo: true };
            const user2Data = { nome: "User 2", email: "user2@email.com", senha_hash: senha, perfil: Perfil.SOLICITANTE, setor: "TI", ativo: true };

            const user1 = await usuarioService.createUser(user1Data as Usuario);
            const user2 = await usuarioService.createUser(user2Data as Usuario);

            // Hashes devem ser diferentes por causa do salt
            expect(user1.senha_hash).not.toBe(user2.senha_hash);
            // Ambos devem ser válidos
            expect(await bcrypt.compare(senha, user1.senha_hash)).toBe(true);
            expect(await bcrypt.compare(senha, user2.senha_hash)).toBe(true);
        });
    });

    describe("Testes integrados (CRUD completo)", () => {
        test("Deve realizar fluxo completo de CRUD", async () => {
            // CREATE
            const newUserData = {
                nome: "Ana Paula",
                email: "ana.paula@email.com",
                senha_hash: "senha123",
                perfil: Perfil.SUPERVISOR,
                setor: "TI",
                ativo: true
            };

            mockDataSource.getRepository().findOne.mockResolvedValue(null);
            mockDataSource.getRepository().create.mockImplementation((data: any) => ({ ...data }));
            mockDataSource.getRepository().save.mockImplementation(async (entity: any) => {
                entity.id = "user-uuid-4";
                entity.created_at = new Date();
                return entity;
            });

            const newUser = await usuarioService.createUser(newUserData as Usuario);
            expect(newUser.id).toBe("user-uuid-4");
            expect(newUser.nome).toBe("Ana Paula");

            // READ
            const mockUser = { id: "user-uuid-4", ...newUserData, created_at: new Date() };
            mockDataSource.getRepository().findOne.mockResolvedValue(mockUser);

            const found = await usuarioService.getById("user-uuid-4");
            expect(found.nome).toBe("Ana Paula");

            // UPDATE
            const updateData = { ativo: false };
            mockDataSource.getRepository().findOne.mockResolvedValue(mockUser);
            mockDataSource.getRepository().save.mockImplementation(async (entity: any) => {
                Object.assign(entity, updateData);
                return entity;
            });

            const updated = await usuarioService.updateUser("user-uuid-4", updateData);
            expect(updated.ativo).toBe(false);

            // DELETE
            mockDataSource.getRepository().findOne.mockResolvedValue(mockUser);
            mockDataSource.getRepository().remove.mockResolvedValue(undefined);

            await expect(usuarioService.deleteUser("user-uuid-4")).resolves.toBeUndefined();

            // Verificar exclusão - deve gerar um erro ao tentar encontrar novamente.
            mockDataSource.getRepository().findOne.mockResolvedValue(null);
            await expect(usuarioService.getById("user-uuid-4")).rejects.toThrow("Usuário não encontrado");
        });
    });

});