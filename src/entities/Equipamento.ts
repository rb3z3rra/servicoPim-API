import {  Column,  Entity,  OneToMany,  PrimaryGeneratedColumn,} from "typeorm";
import { OrdemServico } from "./OrdemServico.js";


@Entity("equipamento")
export class Equipamento {
  @PrimaryGeneratedColumn("increment")
  id!: number;

  @Column({ type: "varchar", unique: true })
  codigo!: string;

  @Column({ type: "varchar", nullable: false })
  nome!: string;

  @Column({ type: "varchar", nullable: false })
  tipo!: string;

  @Column({ type: "varchar", nullable: false })
  localizacao!: string;

  @Column({ type: "varchar", nullable: true })
  fabricante!: string;

  @Column({ type: "varchar", nullable: true })
  modelo!: string;

  @Column({ type: "boolean", default: true })
  ativo!: boolean;

  @OneToMany(() => OrdemServico, (ordemServico) => ordemServico.equipamento)
  ordensServico!: OrdemServico[];

 
}