import { jest } from '@jest/globals';
import { OrdemServicoService } from "../src/services/OrdemServicoService.js";
import { OrdemServico } from "../src/entities/OrdemServico.js";
import { Equipamento } from "../src/entities/Equipamento.js";
import { Usuario } from "../src/entities/Usuario.js";
import { StatusOs } from "../src/types/os_status.js";
import { Prioridade } from "../src/types/os_prioridade.js";
import { TipoManutencao } from "../src/types/os_tipoManutencao.js";
import { Perfil } from "../src/types/usr_perfil.js";

let ordemServicoService: OrdemServicoService;
let mockDataSource: any;

beforeAll(() => {
    mockDataSource = {
        getRepository: jest.fn().mockReturnValue({
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            count: jest.fn()
        })
    };
    ordemServicoService = new OrdemServicoService(mockDataSource);
});

beforeEach(() => {
    jest.clearAllMocks();
});

describe("Testes de Ordens de Serviço", () => {

    describe("CREATE - Criar ordens de serviço", () => {
        test("Deve criar uma nova ordem de serviço com sucesso", async () => {
            const createData = {
                equipamentoId: 1,
                solicitanteId: "user-uuid-1",
                tipo_manutencao: TipoManutencao.CORRETIVA,
                prioridade: Prioridade.ALTA,
                descricao_falha: "Equipamento não liga"
            };

            const mockEquipamento = { id: 1, nome: "Notebook Dell", codigo: "NOTE001" };
            const mockSolicitante = { id: "user-uuid-1", nome: "João Silva", email: "joao@email.com" };

            mockDataSource.getRepository().findOne
                .mockResolvedValueOnce(mockEquipamento) // equipamento
                .mockResolvedValueOnce(mockSolicitante); // solicitante
            mockDataSource.getRepository().count.mockResolvedValue(0);
            mockDataSource.getRepository().create.mockImplementation((data: any) => ({ ...data }));
            mockDataSource.getRepository().save.mockImplementation(async (entity: any) => {
                entity.id = "os-uuid-1";
                entity.abertura_em = new Date();
                return entity;
            });

            // Mock para getById no final
            const mockOSCompleta = {
                id: "os-uuid-1",
                numero: "OS-0001",
                equipamento: mockEquipamento,
                solicitante: mockSolicitante,
                tecnico: null,
                tipo_manutencao: TipoManutencao.CORRETIVA,
                prioridade: Prioridade.ALTA,
                status: StatusOs.ABERTA,
                descricao_falha: "Equipamento não liga",
                abertura_em: new Date()
            };
            mockDataSource.getRepository().findOne.mockResolvedValue(mockOSCompleta);

            const result = await ordemServicoService.createOrdemServico(createData);

            expect(result).toHaveProperty("id");
            expect(result.numero).toBe("OS-0001");
            expect(result.status).toBe(StatusOs.ABERTA);
            expect(result.tipo_manutencao).toBe(TipoManutencao.CORRETIVA);
            expect(result.prioridade).toBe(Prioridade.ALTA);
        });

        test("Deve lançar erro ao criar OS com equipamento inexistente", async () => {
            const createData = {
                equipamentoId: 999,
                solicitanteId: "user-uuid-1",
                tipo_manutencao: TipoManutencao.CORRETIVA,
                prioridade: Prioridade.ALTA,
                descricao_falha: "Equipamento não liga"
            };

            mockDataSource.getRepository().findOne.mockResolvedValue(null); // equipamento não encontrado

            await expect(ordemServicoService.createOrdemServico(createData)).rejects.toThrow("Equipamento não encontrado");
        });

        test("Deve lançar erro ao criar OS com solicitante inexistente", async () => {
            const createData = {
                equipamentoId: 1,
                solicitanteId: "invalid-uuid",
                tipo_manutencao: TipoManutencao.CORRETIVA,
                prioridade: Prioridade.ALTA,
                descricao_falha: "Equipamento não liga"
            };

            const mockEquipamento = { id: 1, nome: "Notebook Dell", codigo: "NOTE001" };

            mockDataSource.getRepository().findOne
                .mockResolvedValueOnce(mockEquipamento) // equipamento encontrado
                .mockResolvedValueOnce(null); // solicitante não encontrado

            await expect(ordemServicoService.createOrdemServico(createData)).rejects.toThrow("Solicitante não encontrado");
        });
    });

    describe("READ - Listar ordens de serviço", () => {
        test("Deve listar todas as ordens de serviço", async () => {
            const mockOSList = [
                {
                    id: "os-uuid-1",
                    numero: "OS-0001",
                    equipamento: { id: 1, nome: "Notebook Dell" },
                    solicitante: { id: "user-uuid-1", nome: "João Silva" },
                    tecnico: null,
                    status: StatusOs.ABERTA,
                    abertura_em: new Date()
                },
                {
                    id: "os-uuid-2",
                    numero: "OS-0002",
                    equipamento: { id: 2, nome: "Mouse" },
                    solicitante: { id: "user-uuid-2", nome: "Maria Santos" },
                    tecnico: { id: "user-uuid-3", nome: "Pedro Costa" },
                    status: StatusOs.EM_ANDAMENTO,
                    abertura_em: new Date()
                }
            ];

            mockDataSource.getRepository().find.mockResolvedValue(mockOSList);

            const allOS = await ordemServicoService.getAll();

            expect(allOS).toHaveLength(2);
            expect(allOS[0]).toMatchObject({
                id: "os-uuid-1",
                numero: "OS-0001"
            });
        });

        test("Deve retornar array vazio se não houver ordens de serviço", async () => {
            mockDataSource.getRepository().find.mockResolvedValue([]);

            const allOS = await ordemServicoService.getAll();

            expect(allOS).toHaveLength(0);
            expect(allOS).toEqual([]);
        });

        test("Deve buscar ordem de serviço por ID existente", async () => {
            const mockOS = {
                id: "os-uuid-1",
                numero: "OS-0001",
                equipamento: { id: 1, nome: "Notebook Dell" },
                solicitante: { id: "user-uuid-1", nome: "João Silva" },
                tecnico: null,
                status: StatusOs.ABERTA,
                abertura_em: new Date()
            };

            mockDataSource.getRepository().findOne.mockResolvedValue(mockOS);

            const os = await ordemServicoService.getById("os-uuid-1");

            expect(os).toBeDefined();
            expect(os.id).toBe("os-uuid-1");
            expect(os.numero).toBe("OS-0001");
        });

        test("Deve lançar erro ao buscar ID inexistente", async () => {
            mockDataSource.getRepository().findOne.mockResolvedValue(null);

            await expect(ordemServicoService.getById("invalid-uuid")).rejects.toThrow("Ordem de serviço não encontrada");
        });
    });

    describe("UPDATE - Atualizar ordens de serviço", () => {
        test("Deve atribuir técnico a ordem de serviço", async () => {
            const mockOS = {
                id: "os-uuid-1",
                numero: "OS-0001",
                equipamento: { id: 1, nome: "Notebook Dell" },
                solicitante: { id: "user-uuid-1", nome: "João Silva" },
                tecnico: null,
                status: StatusOs.ABERTA,
                abertura_em: new Date()
            };
            const mockTecnico = { id: "user-uuid-3", nome: "Pedro Costa", perfil: Perfil.TECNICO };

            mockDataSource.getRepository().findOne
                .mockResolvedValueOnce(mockOS) // getById
                .mockResolvedValueOnce(mockTecnico); // tecnico
            mockDataSource.getRepository().save.mockResolvedValue(mockOS);

            const updatedOS = {
                ...mockOS,
                tecnico: mockTecnico,
                status: StatusOs.EM_ANDAMENTO,
                inicio_em: new Date()
            };
            mockDataSource.getRepository().findOne.mockResolvedValue(updatedOS);

            const result = await ordemServicoService.atribuirTecnico("os-uuid-1", { tecnicoId: "user-uuid-3" });

            expect(result.status).toBe(StatusOs.EM_ANDAMENTO);
            expect(result.tecnico).toEqual(mockTecnico);
            expect(result.inicio_em).toBeDefined();
        });

        test("Deve lançar erro ao atribuir técnico inexistente", async () => {
            const mockOS = {
                id: "os-uuid-1",
                numero: "OS-0001",
                equipamento: { id: 1, nome: "Notebook Dell" },
                solicitante: { id: "user-uuid-1", nome: "João Silva" },
                tecnico: null,
                status: StatusOs.ABERTA,
                abertura_em: new Date()
            };

            mockDataSource.getRepository().findOne
                .mockResolvedValueOnce(mockOS) // getById
                .mockResolvedValueOnce(null); // tecnico não encontrado

            await expect(ordemServicoService.atribuirTecnico("os-uuid-1", { tecnicoId: "invalid-uuid" })).rejects.toThrow("Técnico não encontrado");
        });

        test("Deve atualizar status da ordem de serviço", async () => {
            const mockOS = {
                id: "os-uuid-1",
                numero: "OS-0001",
                equipamento: { id: 1, nome: "Notebook Dell" },
                solicitante: { id: "user-uuid-1", nome: "João Silva" },
                tecnico: { id: "user-uuid-3", nome: "Pedro Costa" },
                status: StatusOs.EM_ANDAMENTO,
                abertura_em: new Date()
            };

            mockDataSource.getRepository().findOne.mockResolvedValue(mockOS);
            mockDataSource.getRepository().save.mockResolvedValue(mockOS);

            const updatedOS = { ...mockOS, status: StatusOs.AGUARDANDO_PECA };
            mockDataSource.getRepository().findOne.mockResolvedValue(updatedOS);

            const result = await ordemServicoService.atualizarStatus("os-uuid-1", { status: StatusOs.AGUARDANDO_PECA });

            expect(result.status).toBe(StatusOs.AGUARDANDO_PECA);
        });

        test("Deve concluir ordem de serviço", async () => {
            const mockOS = {
                id: "os-uuid-1",
                numero: "OS-0001",
                equipamento: { id: 1, nome: "Notebook Dell" },
                solicitante: { id: "user-uuid-1", nome: "João Silva" },
                tecnico: { id: "user-uuid-3", nome: "Pedro Costa" },
                status: StatusOs.EM_ANDAMENTO,
                abertura_em: new Date(),
                inicio_em: new Date()
            };

            const conclusaoData = {
                descricao_servico: "Substituição da placa-mãe",
                pecas_utilizadas: "Placa-mãe modelo XYZ",
                horas_trabalhadas: 4
            };

            mockDataSource.getRepository().findOne.mockResolvedValue(mockOS);
            mockDataSource.getRepository().save.mockResolvedValue(mockOS);

            const concludedOS = {
                ...mockOS,
                ...conclusaoData,
                status: StatusOs.CONCLUIDA,
                conclusao_em: new Date()
            };
            mockDataSource.getRepository().findOne.mockResolvedValue(concludedOS);

            const result = await ordemServicoService.concluirOrdemServico("os-uuid-1", conclusaoData);

            expect(result.status).toBe(StatusOs.CONCLUIDA);
            expect(result.descricao_servico).toBe("Substituição da placa-mãe");
            expect(result.pecas_utilizadas).toBe("Placa-mãe modelo XYZ");
            expect(result.horas_trabalhadas).toBe(4);
            expect(result.conclusao_em).toBeDefined();
        });
    });

    describe("Testes integrados (Fluxo completo de OS)", () => {
        test("Deve realizar fluxo completo de ordem de serviço", async () => {
            // Limpar mocks antes do teste integrado
            jest.clearAllMocks();

            // 1. CREATE - Criar OS
            const createData = {
                equipamentoId: 1,
                solicitanteId: "user-uuid-1",
                tipo_manutencao: TipoManutencao.CORRETIVA,
                prioridade: Prioridade.ALTA,
                descricao_falha: "Equipamento não liga"
            };

            const mockEquipamento = { id: 1, nome: "Notebook Dell", codigo: "NOTE001" };
            const mockSolicitante = { id: "user-uuid-1", nome: "João Silva", email: "joao@email.com" };

            // Setup mocks para criação
            mockDataSource.getRepository().findOne
                .mockResolvedValueOnce(mockEquipamento)
                .mockResolvedValueOnce(mockSolicitante);
            mockDataSource.getRepository().count.mockResolvedValue(0);
            mockDataSource.getRepository().create.mockImplementation((data: any) => ({ ...data }));
            mockDataSource.getRepository().save.mockImplementation(async (entity: any) => {
                entity.id = "os-uuid-1";
                entity.abertura_em = new Date();
                return entity;
            });

            const mockOSCreated = {
                id: "os-uuid-1",
                numero: "OS-0001",
                equipamento: mockEquipamento,
                solicitante: mockSolicitante,
                tecnico: null,
                tipo_manutencao: TipoManutencao.CORRETIVA,
                prioridade: Prioridade.ALTA,
                status: StatusOs.ABERTA,
                descricao_falha: "Equipamento não liga",
                abertura_em: new Date()
            };

            // Mock para o getById chamado no final do createOrdemServico
            mockDataSource.getRepository().findOne.mockResolvedValue(mockOSCreated);

            const createdOS = await ordemServicoService.createOrdemServico(createData);
            expect(createdOS.status).toBe(StatusOs.ABERTA);
            expect(createdOS.numero).toBe("OS-0001");

            // 2. UPDATE - Atribuir técnico
            jest.clearAllMocks();
            const mockTecnico = { id: "user-uuid-3", nome: "Pedro Costa", perfil: Perfil.TECNICO };

            mockDataSource.getRepository().findOne
                .mockResolvedValueOnce(mockOSCreated)
                .mockResolvedValueOnce(mockTecnico);
            mockDataSource.getRepository().save.mockResolvedValue(mockOSCreated);

            const osComTecnico = {
                ...mockOSCreated,
                tecnico: mockTecnico,
                status: StatusOs.EM_ANDAMENTO,
                inicio_em: new Date()
            };
            mockDataSource.getRepository().findOne.mockResolvedValue(osComTecnico);

            const osAtribuida = await ordemServicoService.atribuirTecnico("os-uuid-1", { tecnicoId: "user-uuid-3" });
            expect(osAtribuida.status).toBe(StatusOs.EM_ANDAMENTO);
            expect(osAtribuida.tecnico).toBeDefined();

            // 3. UPDATE - Concluir OS
            jest.clearAllMocks();
            const conclusaoData = {
                descricao_servico: "Reparo concluído com sucesso",
                horas_trabalhadas: 2
            };

            mockDataSource.getRepository().findOne.mockResolvedValue(osComTecnico);
            mockDataSource.getRepository().save.mockResolvedValue(osComTecnico);

            const osConcluida = {
                ...osComTecnico,
                ...conclusaoData,
                status: StatusOs.CONCLUIDA,
                conclusao_em: new Date()
            };
            mockDataSource.getRepository().findOne.mockResolvedValue(osConcluida);

            const osFinal = await ordemServicoService.concluirOrdemServico("os-uuid-1", conclusaoData);
            expect(osFinal.status).toBe(StatusOs.CONCLUIDA);
            expect(osFinal.descricao_servico).toBe("Reparo concluído com sucesso");
            expect(osFinal.horas_trabalhadas).toBe(2);
        });
    });

});