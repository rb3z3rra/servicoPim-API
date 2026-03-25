import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { TipoManutencao } from "../types/tipoManutencao.js";

@Entity('ordemServico')
export class OrdemServico {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: "varchar", unique: true, })
    numero!: string

    //    equipamento_id FK → equipamento Equipamento com falha reportada

    @Column({ type: "enum", enum: TipoManutencao })
    tipo_manutencao!: TipoManutencao;



}