import {  Column,  CreateDateColumn,  Entity,  OneToMany,  PrimaryGeneratedColumn, type Relation,} from "typeorm";
import { Perfil } from "../types/usr_perfil.js";
import { OrdemServico } from "./OrdemServico.js";
import { HistoricoOS } from "./HistoricoOS.js";

@Entity("usuario")
export class Usuario {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", nullable: false })
  nome!: string;

  @Column({ type: "varchar", unique: true, nullable: false })
  email!: string;

  @Column({ type: "varchar", unique: true, nullable: false })
  matricula!: string;

  @Column({ type: "varchar", nullable: false, select: false })
  senha_hash!: string;

  @Column({ type: "enum", enum: Perfil, default: Perfil.SOLICITANTE })
  perfil!: Perfil;

  @Column({ type: "varchar", nullable: true })
  setor!: string | null;

  @Column({ type: "boolean", default: true })
  ativo!: boolean;

  @CreateDateColumn({ type: "timestamptz" })
  created_at!: Date;

  @OneToMany(() => OrdemServico, (ordemServico) => ordemServico.solicitante)
  ordensSolicitadas!: OrdemServico[];

  @OneToMany(() => OrdemServico, (ordemServico) => ordemServico.tecnico)
  ordensTecnico!: OrdemServico[];

  @OneToMany(() => HistoricoOS, (historicoOS) => historicoOS.usuario)
  historicosOS!: Relation<HistoricoOS[]>;
}
