import type { DataSource } from "typeorm";
import { OrdemServico } from "../entities/OrdemServico.js";
import { StatusOs } from "../types/os_status.js";
type CreateOrdemServicoDTO = {
    equipamentoId: number;
    solicitanteId: string;
    tipo_manutencao: OrdemServico["tipo_manutencao"];
    prioridade: OrdemServico["prioridade"];
    descricao_falha: string;
};
type AtribuirTecnicoDTO = {
    tecnicoId: string;
};
type AtualizarStatusDTO = {
    status: StatusOs;
};
type ConcluirOrdemServicoDTO = {
    descricao_servico: string;
    pecas_utilizadas?: string;
    horas_trabalhadas: number;
};
export declare class OrdemServicoService {
    private ordemServicoRepo;
    private equipamentoRepo;
    private usuarioRepo;
    constructor(appDataSource: DataSource);
    getAll(): Promise<OrdemServico[]>;
    getById(id: string): Promise<OrdemServico>;
    createOrdemServico(data: CreateOrdemServicoDTO): Promise<OrdemServico>;
    atribuirTecnico(id: string, data: AtribuirTecnicoDTO): Promise<OrdemServico>;
    atualizarStatus(id: string, data: AtualizarStatusDTO): Promise<OrdemServico>;
    concluirOrdemServico(id: string, data: ConcluirOrdemServicoDTO): Promise<OrdemServico>;
    private gerarNumeroOS;
}
export {};
//# sourceMappingURL=OrdemServicoService.d.ts.map