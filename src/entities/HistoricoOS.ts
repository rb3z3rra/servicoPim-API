import {  Entity,  PrimaryGeneratedColumn,  Column,
  ManyToOne,  JoinColumn,  CreateDateColumn,} from "typeorm";
import { OrdemServico } from "./OrdemServico.js";
import { Usuario } from "./Usuario.js";
import type { Relation } from "typeorm";

@Entity("historico_os")
export class HistoricoOS {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "os_id", type: "uuid" })
  osId!: string;

  @Column({ name: "usuario_id", type: "uuid" })
  usuarioId!: string;

  @Column({ name: "status_anterior", type: "varchar", length: 50, nullable: true })
  statusAnterior!: string | null;

  @Column({ name: "status_novo", type: "varchar", length: 50 })
  statusNovo!: string;

  @Column({ type: "text", nullable: true })
  observacao!: string | null;

  @CreateDateColumn({ name: "registrado_em", type: "timestamptz" })
  registradoEm!: Date;

  @ManyToOne(() => OrdemServico, (ordemServico) => ordemServico.historicos, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "os_id" })
    ordemServico!: Relation<OrdemServico>;

  @ManyToOne(() => Usuario, (usuario) => usuario.historicosOS, {
    onDelete: "NO ACTION",
  })
  @JoinColumn({ name: "usuario_id" })
    usuario!: Relation<Usuario>;
}
