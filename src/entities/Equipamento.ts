import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('equipamento')
export class Equipamento {
    @PrimaryGeneratedColumn('increment')
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
    fabricante!: string

    @Column({ type: "varchar", nullable: true })
    modelo!: string

    @Column({ type: "boolean", default: true })
    ativo!: boolean;
}