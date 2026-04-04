import { jest } from '@jest/globals';
import { EquipamentoService } from "../src/services/EquipamentoService.js";
import { Equipamento } from "../src/entities/Equipamento.js";

let equipamentoService: EquipamentoService;
let mockDataSource: any;
let idCounter = 1;

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
    equipamentoService = new EquipamentoService(mockDataSource);
});

beforeEach(() => {
    jest.clearAllMocks();
});

describe("Testes CRUD de Equipamentos", () => {

    describe("CREATE - Criar equipamentos", () => {
        test("Deve criar um novo equipamento com sucesso", async () => {
            const newEquipment = {
                codigo: "TEC001",
                nome: "Teclado Mecânico",
                tipo: "Periférico",
                localizacao: "Escritório",
                ativo: true
            };

            mockDataSource.getRepository().findOne.mockResolvedValue(null);
            mockDataSource.getRepository().create.mockImplementation((data: any) => ({ ...data }));
            mockDataSource.getRepository().save.mockImplementation(async (entity: any) => {
                entity.id = idCounter++;
                return entity;
            });

            const result = await equipamentoService.createEquipamento(newEquipment as Equipamento);

            expect(result).toHaveProperty("id");
            expect(result.nome).toBe("Teclado Mecânico");
            expect(result.tipo).toBe("Periférico");
            expect(result.ativo).toBe(true);
        });

        test("Deve criar múltiplos equipamentos com IDs incrementais", async () => {
            const equip1Data = { codigo: "MOU001", nome: "Mouse", tipo: "Periférico", localizacao: "Escritório", ativo: true };
            const equip2Data = { codigo: "WEB001", nome: "Webcam", tipo: "Periférico", localizacao: "Escritório", ativo: true };

            mockDataSource.getRepository().findOne.mockResolvedValue(null);
            mockDataSource.getRepository().create.mockImplementation((data: any) => ({ ...data }));
            mockDataSource.getRepository().save.mockImplementation(async (entity: any) => {
                entity.id = idCounter++;
                return entity;
            });

            const equip1 = await equipamentoService.createEquipamento(equip1Data as Equipamento);
            const equip2 = await equipamentoService.createEquipamento(equip2Data as Equipamento);

            expect(equip1.id).toBe(2);
            expect(equip2.id).toBe(3);
        });

        test("Deve lançar erro ao criar equipamento com código já existente", async () => {
            const newEquipment = {
                codigo: "TEC001",
                nome: "Teclado Duplicado",
                tipo: "Periférico",
                localizacao: "Escritório",
                ativo: true
            };

            mockDataSource.getRepository().findOne.mockResolvedValue({ id: 1, codigo: "TEC001" });

            await expect(equipamentoService.createEquipamento(newEquipment as Equipamento)).rejects.toThrow("Código do equipamento já cadastrado");
        });
    });

    describe("READ - Listar equipamentos", () => {
        test("Deve listar todos os equipamentos", async () => {
            const mockEquipments = [
                { id: 1, codigo: "TEC001", nome: "Teclado Mecânico", tipo: "Periférico", localizacao: "Escritório", ativo: true },
                { id: 2, codigo: "MOU001", nome: "Mouse", tipo: "Periférico", localizacao: "Escritório", ativo: true }
            ];

            mockDataSource.getRepository().find.mockResolvedValue(mockEquipments);

            const allEquipments = await equipamentoService.getAll();

            expect(allEquipments).toHaveLength(2);
            expect(allEquipments[0]).toMatchObject({
                id: 1,
                nome: "Teclado Mecânico"
            });
        });

        test("Deve retornar array vazio se não houver equipamentos", async () => {
            mockDataSource.getRepository().find.mockResolvedValue([]);

            const allEquipments = await equipamentoService.getAll();

            expect(allEquipments).toHaveLength(0);
            expect(allEquipments).toEqual([]);
        });

        test("Deve buscar equipamento por ID existente", async () => {
            const mockEquipment = { id: 1, codigo: "TEC001", nome: "Teclado Mecânico", tipo: "Periférico", localizacao: "Escritório", ativo: true };

            mockDataSource.getRepository().findOne.mockResolvedValue(mockEquipment);

            const equipment = await equipamentoService.getById(1);

            expect(equipment).toBeDefined();
            expect(equipment.id).toBe(1);
            expect(equipment.nome).toBe("Teclado Mecânico");
        });

        test("Deve lançar erro ao buscar ID inexistente", async () => {
            mockDataSource.getRepository().findOne.mockResolvedValue(null);

            await expect(equipamentoService.getById(999)).rejects.toThrow("Equipamento não encontrado");
        });
    });

    describe("UPDATE - Atualizar equipamentos", () => {
        test("Deve atualizar equipamento existente com sucesso", async () => {
            const existingEquipment = { id: 1, codigo: "TEC001", nome: "Teclado Mecânico", tipo: "Periférico", localizacao: "Escritório", ativo: true };
            const updateData = { nome: "Teclado Mecânico Atualizado", ativo: false };

            mockDataSource.getRepository().findOne.mockResolvedValue(existingEquipment);
            mockDataSource.getRepository().save.mockImplementation(async (entity: any) => entity);

            const updated = await equipamentoService.updateEquipamento(1, updateData);

            expect(updated).toMatchObject({ ...existingEquipment, ...updateData });
            expect(updated.id).toBe(1);
        });

        test("Deve atualizar apenas campos específicos", async () => {
            const existingEquipment = { id: 1, codigo: "TEC001", nome: "Teclado Mecânico", tipo: "Periférico", localizacao: "Escritório", ativo: true };
            const updateData = { ativo: false };

            mockDataSource.getRepository().findOne.mockResolvedValue(existingEquipment);
            mockDataSource.getRepository().save.mockImplementation(async (entity: any) => entity);

            const updated = await equipamentoService.updateEquipamento(1, updateData);

            expect(updated.ativo).toBe(false);
            expect(updated.nome).toBe("Teclado Mecânico"); // Mantém o nome original
        });

        test("Deve lançar erro ao tentar atualizar ID inexistente", async () => {
            mockDataSource.getRepository().findOne.mockResolvedValue(null);

            await expect(equipamentoService.updateEquipamento(999, { nome: "Teste" })).rejects.toThrow("Equipamento não encontrado");
        });

        test("Deve lançar erro ao tentar atualizar para código já existente", async () => {
            const existingEquipment = { id: 1, codigo: "TEC001", nome: "Teclado Mecânico", tipo: "Periférico", localizacao: "Escritório", ativo: true };
            const updateData = { codigo: "MOU001" };

            mockDataSource.getRepository().findOne
                .mockResolvedValueOnce(existingEquipment) // para getById
                .mockResolvedValueOnce({ id: 2, codigo: "MOU001" }); // para verificar duplicados

            await expect(equipamentoService.updateEquipamento(1, updateData)).rejects.toThrow("Código do equipamento já cadastrado");
        });
    });

    describe("DELETE - Remover equipamentos", () => {
        test("Deve deletar equipamento existente com sucesso", async () => {
            const existingEquipment = { id: 1, codigo: "TEC001", nome: "Teclado Mecânico", tipo: "Periférico", localizacao: "Escritório", ativo: true };

            mockDataSource.getRepository().findOne.mockResolvedValue(existingEquipment);
            mockDataSource.getRepository().remove.mockResolvedValue(undefined);

            await expect(equipamentoService.deleteEquipamento(1)).resolves.toBeUndefined();

            expect(mockDataSource.getRepository().remove).toHaveBeenCalledWith(existingEquipment);
        });

        test("Deve lançar erro ao tentar deletar ID inexistente", async () => {
            mockDataSource.getRepository().findOne.mockResolvedValue(null);

            await expect(equipamentoService.deleteEquipamento(999)).rejects.toThrow("Equipamento não encontrado");
        });

        test("Deve permitir deletar múltiplos equipamentos sequencialmente", async () => {
            const equip1 = { id: 1, codigo: "TEC001", nome: "Teclado Mecânico", tipo: "Periférico", localizacao: "Escritório", ativo: true };
            const equip2 = { id: 2, codigo: "MOU001", nome: "Mouse", tipo: "Periférico", localizacao: "Escritório", ativo: true };

            mockDataSource.getRepository().findOne
                .mockResolvedValueOnce(equip1)
                .mockResolvedValueOnce(equip2);
            mockDataSource.getRepository().remove.mockResolvedValue(undefined);

            await expect(equipamentoService.deleteEquipamento(1)).resolves.toBeUndefined();
            await expect(equipamentoService.deleteEquipamento(2)).resolves.toBeUndefined();

            expect(mockDataSource.getRepository().remove).toHaveBeenCalledTimes(2);
        });
    });

    describe("Testes integrados (CRUD completo)", () => {
        test("Deve realizar fluxo completo de CRUD", async () => {
            // CREATE
            const newEquipData = {
                codigo: "TAB001",
                nome: "Tablet",
                tipo: "Mobile",
                localizacao: "Escritório",
                ativo: true
            };

            mockDataSource.getRepository().findOne.mockResolvedValue(null);
            mockDataSource.getRepository().create.mockImplementation((data: any) => ({ ...data }));
            mockDataSource.getRepository().save.mockImplementation(async (entity: any) => {
                entity.id = 4;
                return entity;
            });

            const newEquip = await equipamentoService.createEquipamento(newEquipData as Equipamento);
            expect(newEquip.id).toBe(4);
            expect(newEquip.nome).toBe("Tablet");

            // READ
            const mockEquipment = { id: 4, ...newEquipData };
            mockDataSource.getRepository().findOne.mockResolvedValue(mockEquipment);

            const found = await equipamentoService.getById(4);
            expect(found.nome).toBe("Tablet");

            // UPDATE
            const updateData = { ativo: false };
            mockDataSource.getRepository().findOne.mockResolvedValue(mockEquipment);
            mockDataSource.getRepository().save.mockImplementation(async (entity: any) => {
                Object.assign(entity, updateData);
                return entity;
            });

            const updated = await equipamentoService.updateEquipamento(4, updateData);
            expect(updated.ativo).toBe(false);

            // DELETE
            mockDataSource.getRepository().findOne.mockResolvedValue(mockEquipment);
            mockDataSource.getRepository().remove.mockResolvedValue(undefined);

            await expect(equipamentoService.deleteEquipamento(4)).resolves.toBeUndefined();

            // Verificar exclusão - deve gerar um erro ao tentar encontrar novamente.
            mockDataSource.getRepository().findOne.mockResolvedValue(null);
            await expect(equipamentoService.getById(4)).rejects.toThrow("Equipamento não encontrado");
        });
    });

});