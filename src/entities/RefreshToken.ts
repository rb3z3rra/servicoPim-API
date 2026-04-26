import {  Column,  CreateDateColumn,  Entity,  Index,  JoinColumn,  ManyToOne,  PrimaryGeneratedColumn,  type Relation,} from "typeorm";
import { Usuario } from "./Usuario.js";

@Entity("refresh_token")
export class RefreshToken {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index("IDX_refresh_token_jti", { unique: true })
  @Column({ type: "uuid" })
  jti!: string;

  @Column({ type: "varchar", length: 64 })
  tokenHash!: string;

  @Column({ type: "timestamptz" })
  expiresAt!: Date;

  @Column({ type: "timestamptz", nullable: true })
  revokedAt!: Date | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @ManyToOne(() => Usuario, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({ name: "usuario_id" })
  usuario!: Relation<Usuario>;
}
