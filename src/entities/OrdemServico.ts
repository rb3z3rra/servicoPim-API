import {  Column,  Entity,  JoinColumn,  ManyToOne,  PrimaryGeneratedColumn,} from "typeorm";
import { Prioridade } from "../types/os_prioridade.js";
import { TipoManutencao } from "../types/os_tipoManutencao.js";
import { StatusOs } from "../types/os_status.js";
import { Equipamento } from "./Equipamento.js";
import { Usuario } from "./Usuario.js";

@Entity("ordem_servico")
export class OrdemServico {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", unique: true })
  numero!: string;

  @ManyToOne(() => Equipamento, (equipamento) => equipamento.ordensServico, {
    nullable: false,
  })
  @JoinColumn({ name: "equipamento_id" })
  equipamento!: Equipamento;

  @ManyToOne(() => Usuario, (usuario) => usuario.ordensSolicitadas, {
    nullable: false,
  })
  @JoinColumn({ name: "solicitante_id" })
  solicitante!: Usuario;

  @ManyToOne(() => Usuario, (usuario) => usuario.ordensTecnico, {
    nullable: true,
  })
  @JoinColumn({ name: "tecnico_id" })
  tecnico!: Usuario | null;

  @Column({ type: "enum", enum: TipoManutencao })
  tipo_manutencao!: TipoManutencao;

  @Column({ type: "enum", enum: Prioridade })
  prioridade!: Prioridade;

  @Column({ type: "enum", enum: StatusOs, default: StatusOs.ABERTA })
  status!: StatusOs;

  @Column({ type: "varchar", nullable: false })
  descricao_falha!: string;

  @Column({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  abertura_em!: Date;

  @Column({ type: "timestamptz", nullable: true })
  inicio_em!: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  conclusao_em!: Date | null;

  @Column({ type: "varchar", nullable: true })
  descricao_servico!: string | null;

  @Column({ type: "varchar", nullable: true })
  pecas_utilizadas!: string | null;

  @Column({ type: "numeric", nullable: true })
  horas_trabalhadas!: number | null;
}