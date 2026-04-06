var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, } from "typeorm";
import { Perfil } from "../types/usr_perfil.js";
import { OrdemServico } from "./OrdemServico.js";
let Usuario = class Usuario {
    id;
    nome;
    email;
    senha_hash;
    perfil;
    setor;
    ativo;
    created_at;
    ordensSolicitadas;
    ordensTecnico;
};
__decorate([
    PrimaryGeneratedColumn("uuid"),
    __metadata("design:type", String)
], Usuario.prototype, "id", void 0);
__decorate([
    Column({ type: "varchar", nullable: false }),
    __metadata("design:type", String)
], Usuario.prototype, "nome", void 0);
__decorate([
    Column({ type: "varchar", unique: true, nullable: false }),
    __metadata("design:type", String)
], Usuario.prototype, "email", void 0);
__decorate([
    Column({ type: "varchar", nullable: false, select: false }),
    __metadata("design:type", String)
], Usuario.prototype, "senha_hash", void 0);
__decorate([
    Column({ type: "enum", enum: Perfil, default: Perfil.SOLICITANTE }),
    __metadata("design:type", String)
], Usuario.prototype, "perfil", void 0);
__decorate([
    Column({ type: "varchar", nullable: true }),
    __metadata("design:type", String)
], Usuario.prototype, "setor", void 0);
__decorate([
    Column({ type: "boolean", default: true }),
    __metadata("design:type", Boolean)
], Usuario.prototype, "ativo", void 0);
__decorate([
    CreateDateColumn({ type: "timestamptz" }),
    __metadata("design:type", Date)
], Usuario.prototype, "created_at", void 0);
__decorate([
    OneToMany(() => OrdemServico, (ordemServico) => ordemServico.solicitante),
    __metadata("design:type", Array)
], Usuario.prototype, "ordensSolicitadas", void 0);
__decorate([
    OneToMany(() => OrdemServico, (ordemServico) => ordemServico.tecnico),
    __metadata("design:type", Array)
], Usuario.prototype, "ordensTecnico", void 0);
Usuario = __decorate([
    Entity("usuario")
], Usuario);
export { Usuario };
//# sourceMappingURL=Usuario.js.map