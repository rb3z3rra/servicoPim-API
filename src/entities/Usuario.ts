import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";
import { Perfil } from "../types/usr_perfil.js";

@Entity('usuario')
export class Usuario {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: "varchar", nullable: false })
    nome!: string;

    @Column({ type: "varchar", unique: true, nullable: false })
    email!: string;

    @Column({ type: "varchar", nullable: false, select: false })
    senha_hash!: string;

    @Column({ type: "enum", enum: Perfil, default: Perfil.SOLICITANTE })
    perfil!: Perfil

    @Column({ type: "varchar", nullable: true })
    setor!: string

    @Column({ type: "boolean", default: true })
    ativo!: boolean

    @CreateDateColumn({ type: "timestamptz" })
    created_at!: Date;
}