var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Column, Entity, OneToMany, PrimaryGeneratedColumn, } from "typeorm";
import { OrdemServico } from "./OrdemServico.js";
let Equipamento = class Equipamento {
    id;
    codigo;
    nome;
    tipo;
    localizacao;
    fabricante;
    modelo;
    ativo;
    ordensServico;
};
__decorate([
    PrimaryGeneratedColumn("increment"),
    __metadata("design:type", Number)
], Equipamento.prototype, "id", void 0);
__decorate([
    Column({ type: "varchar", unique: true }),
    __metadata("design:type", String)
], Equipamento.prototype, "codigo", void 0);
__decorate([
    Column({ type: "varchar", nullable: false }),
    __metadata("design:type", String)
], Equipamento.prototype, "nome", void 0);
__decorate([
    Column({ type: "varchar", nullable: false }),
    __metadata("design:type", String)
], Equipamento.prototype, "tipo", void 0);
__decorate([
    Column({ type: "varchar", nullable: false }),
    __metadata("design:type", String)
], Equipamento.prototype, "localizacao", void 0);
__decorate([
    Column({ type: "varchar", nullable: true }),
    __metadata("design:type", String)
], Equipamento.prototype, "fabricante", void 0);
__decorate([
    Column({ type: "varchar", nullable: true }),
    __metadata("design:type", String)
], Equipamento.prototype, "modelo", void 0);
__decorate([
    Column({ type: "boolean", default: true }),
    __metadata("design:type", Boolean)
], Equipamento.prototype, "ativo", void 0);
__decorate([
    OneToMany(() => OrdemServico, (ordemServico) => ordemServico.equipamento),
    __metadata("design:type", Array)
], Equipamento.prototype, "ordensServico", void 0);
Equipamento = __decorate([
    Entity("equipamento")
], Equipamento);
export { Equipamento };
//# sourceMappingURL=Equipamento.js.map