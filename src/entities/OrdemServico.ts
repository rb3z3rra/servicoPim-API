import { Column, Entity, PrimaryGeneratedColumn, Timestamp } from "typeorm";
import { TipoManutencao } from "../types/os_tipoManutencao.js";
import { Prioridade } from "../types/os_prioridade.js";
import { StatusOs } from "../types/os_status.js";

@Entity('ordemServico')
export class OrdemServico {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: "varchar", unique: true, })
    numero!: string

    //    equipamento_id FK → equipamento Equipamento com falha reportada

    @Column({ type: "enum", enum: TipoManutencao })
    tipo_manutencao!: TipoManutencao;

    @Column({ type: "enum", enum: Prioridade })
    prioridade!: Prioridade;

    @Column({ type: "enum", enum: StatusOs })
    status!: StatusOs

    @Column({ type: "varchar", nullable: false })
    descricao_falha!: string

    //solicitante_id

    //tecnico_id?

    @Column({ type: "timestamptz", default: Date.now() })
    abertura_em!: Date;

    @Column({ type: "timestamptz", nullable: true })
    inicio_em!: Date;

    @Column({ type: "timestamptz", nullable: true })
    conclusao_em!: Date;

    @Column({ type: "varchar", nullable: true })
    descricao_servico!: string;

    @Column({ type: "varchar", nullable: true })
    pecas_utilizadas!: string;

    @Column({ type: "number", nullable: true })
    horas_trabalhadas!: number;
}

