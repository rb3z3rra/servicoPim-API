import type { Relation } from "typeorm";
import { Prioridade } from "../types/os_prioridade.js";
import { TipoManutencao } from "../types/os_tipoManutencao.js";
import { StatusOs } from "../types/os_status.js";
import { Equipamento } from "./Equipamento.js";
import { Usuario } from "./Usuario.js";
export declare class OrdemServico {
    id: string;
    numero: string;
    equipamento: Relation<Equipamento>;
    solicitante: Relation<Usuario>;
    tecnico: Relation<Usuario> | null;
    tipo_manutencao: TipoManutencao;
    prioridade: Prioridade;
    status: StatusOs;
    descricao_falha: string;
    abertura_em: Date;
    inicio_em: Date | null;
    conclusao_em: Date | null;
    descricao_servico: string | null;
    pecas_utilizadas: string | null;
    horas_trabalhadas: number | null;
}
//# sourceMappingURL=OrdemServico.d.ts.map