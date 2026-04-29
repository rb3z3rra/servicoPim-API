import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  type Relation,
} from "typeorm";
import { Prioridade } from "../types/os_prioridade.js";
import { Usuario } from "./Usuario.js";

@Entity("configuracao_prazo_atendimento")
export class ConfiguracaoPrazoAtendimento {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "enum", enum: Prioridade, unique: true })
  prioridade!: Prioridade;

  @Column({ type: "integer" })
  horas_limite!: number;

  @Column({ type: "boolean", default: true })
  ativo!: boolean;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: "atualizado_por_id" })
  atualizadoPor!: Relation<Usuario> | null;

  @UpdateDateColumn({ type: "timestamptz" })
  atualizado_em!: Date;
}
