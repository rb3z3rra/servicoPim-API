import { OrdemServico } from "../entities/OrdemServico.js";
import { Equipamento } from "../entities/Equipamento.js";
import { Usuario } from "../entities/Usuario.js";
import { StatusOs } from "../types/os_status.js";
import { Perfil } from "../types/usr_perfil.js";
export class OrdemServicoService {
    ordemServicoRepo;
    equipamentoRepo;
    usuarioRepo;
    constructor(appDataSource) {
        this.ordemServicoRepo = appDataSource.getRepository(OrdemServico);
        this.equipamentoRepo = appDataSource.getRepository(Equipamento);
        this.usuarioRepo = appDataSource.getRepository(Usuario);
    }
    async getAll() {
        return await this.ordemServicoRepo.find({
            relations: ["equipamento", "solicitante", "tecnico"],
            order: { abertura_em: "DESC" },
        });
    }
    async getById(id) {
        const ordemServico = await this.ordemServicoRepo.findOne({
            where: { id },
            relations: ["equipamento", "solicitante", "tecnico"],
        });
        if (!ordemServico) {
            throw new Error("Ordem de serviço não encontrada");
        }
        return ordemServico;
    }
    async createOrdemServico(data) {
        const equipamento = await this.equipamentoRepo.findOne({
            where: { id: data.equipamentoId },
        });
        if (!equipamento) {
            throw new Error("Equipamento não encontrado");
        }
        const solicitante = await this.usuarioRepo.findOne({
            where: { id: data.solicitanteId },
        });
        if (!solicitante) {
            throw new Error("Solicitante não encontrado");
        }
        const numero = await this.gerarNumeroOS();
        const novaOrdemServico = this.ordemServicoRepo.create({
            numero,
            equipamento,
            solicitante,
            tecnico: null,
            tipo_manutencao: data.tipo_manutencao,
            prioridade: data.prioridade,
            status: StatusOs.ABERTA,
            descricao_falha: data.descricao_falha,
        });
        await this.ordemServicoRepo.save(novaOrdemServico);
        return await this.getById(novaOrdemServico.id);
    }
    async atribuirTecnico(id, data) {
        const ordemServico = await this.getById(id);
        const tecnico = await this.usuarioRepo.findOne({
            where: { id: data.tecnicoId },
        });
        if (!tecnico) {
            throw new Error("Técnico não encontrado");
        }
        if (tecnico.perfil !== Perfil.TECNICO) {
            throw new Error("O usuário informado não é um técnico");
        }
        ordemServico.tecnico = tecnico;
        if (ordemServico.status === StatusOs.ABERTA) {
            ordemServico.status = StatusOs.EM_ANDAMENTO;
            ordemServico.inicio_em = new Date();
        }
        await this.ordemServicoRepo.save(ordemServico);
        return await this.getById(ordemServico.id);
    }
    async atualizarStatus(id, data) {
        const ordemServico = await this.getById(id);
        if (ordemServico.status === StatusOs.CONCLUIDA) {
            throw new Error("Não é possível alterar uma OS concluída");
        }
        if (ordemServico.status === StatusOs.CANCELADA) {
            throw new Error("Não é possível alterar uma OS cancelada");
        }
        ordemServico.status = data.status;
        if (data.status === StatusOs.EM_ANDAMENTO && !ordemServico.inicio_em) {
            ordemServico.inicio_em = new Date();
        }
        await this.ordemServicoRepo.save(ordemServico);
        return await this.getById(ordemServico.id);
    }
    async concluirOrdemServico(id, data) {
        const ordemServico = await this.getById(id);
        if (!ordemServico.tecnico) {
            throw new Error("Não é possível concluir uma OS sem técnico atribuído");
        }
        if (!data.descricao_servico) {
            throw new Error("Descrição do serviço é obrigatória");
        }
        if (data.horas_trabalhadas === undefined || data.horas_trabalhadas === null) {
            throw new Error("Horas trabalhadas é obrigatório");
        }
        ordemServico.descricao_servico = data.descricao_servico;
        ordemServico.pecas_utilizadas = data.pecas_utilizadas ?? null;
        ordemServico.horas_trabalhadas = data.horas_trabalhadas;
        ordemServico.status = StatusOs.CONCLUIDA;
        ordemServico.conclusao_em = new Date();
        if (!ordemServico.inicio_em) {
            ordemServico.inicio_em = new Date();
        }
        await this.ordemServicoRepo.save(ordemServico);
        return await this.getById(ordemServico.id);
    }
    async gerarNumeroOS() {
        const total = await this.ordemServicoRepo.count();
        const proximoNumero = total + 1;
        return `OS-${String(proximoNumero).padStart(4, "0")}`;
    }
}
//# sourceMappingURL=OrdemServicoService.js.map