var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Prioridade } from "../types/os_prioridade.js";
import { TipoManutencao } from "../types/os_tipoManutencao.js";
import { StatusOs } from "../types/os_status.js";
import { Equipamento } from "./Equipamento.js";
import { Usuario } from "./Usuario.js";
let OrdemServico = class OrdemServico {
    id;
    numero;
    equipamento;
    solicitante;
    tecnico;
    tipo_manutencao;
    prioridade;
    status;
    descricao_falha;
    abertura_em;
    inicio_em;
    conclusao_em;
    descricao_servico;
    pecas_utilizadas;
    horas_trabalhadas;
};
__decorate([
    PrimaryGeneratedColumn("uuid"),
    __metadata("design:type", String)
], OrdemServico.prototype, "id", void 0);
__decorate([
    Column({ type: "varchar", unique: true }),
    __metadata("design:type", String)
], OrdemServico.prototype, "numero", void 0);
__decorate([
    ManyToOne(() => Equipamento, (equipamento) => equipamento.ordensServico, {
        nullable: false,
    }),
    JoinColumn({ name: "equipamento_id" }),
    __metadata("design:type", Object)
], OrdemServico.prototype, "equipamento", void 0);
__decorate([
    ManyToOne(() => Usuario, (usuario) => usuario.ordensSolicitadas, {
        nullable: false,
    }),
    JoinColumn({ name: "solicitante_id" }),
    __metadata("design:type", Object)
], OrdemServico.prototype, "solicitante", void 0);
__decorate([
    ManyToOne(() => Usuario, (usuario) => usuario.ordensTecnico, {
        nullable: true,
    }),
    JoinColumn({ name: "tecnico_id" }),
    __metadata("design:type", Object)
], OrdemServico.prototype, "tecnico", void 0);
__decorate([
    Column({ type: "enum", enum: TipoManutencao }),
    __metadata("design:type", String)
], OrdemServico.prototype, "tipo_manutencao", void 0);
__decorate([
    Column({ type: "enum", enum: Prioridade }),
    __metadata("design:type", String)
], OrdemServico.prototype, "prioridade", void 0);
__decorate([
    Column({ type: "enum", enum: StatusOs, default: StatusOs.ABERTA }),
    __metadata("design:type", String)
], OrdemServico.prototype, "status", void 0);
__decorate([
    Column({ type: "varchar", nullable: false }),
    __metadata("design:type", String)
], OrdemServico.prototype, "descricao_falha", void 0);
__decorate([
    Column({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" }),
    __metadata("design:type", Date)
], OrdemServico.prototype, "abertura_em", void 0);
__decorate([
    Column({ type: "timestamptz", nullable: true }),
    __metadata("design:type", Object)
], OrdemServico.prototype, "inicio_em", void 0);
__decorate([
    Column({ type: "timestamptz", nullable: true }),
    __metadata("design:type", Object)
], OrdemServico.prototype, "conclusao_em", void 0);
__decorate([
    Column({ type: "varchar", nullable: true }),
    __metadata("design:type", Object)
], OrdemServico.prototype, "descricao_servico", void 0);
__decorate([
    Column({ type: "varchar", nullable: true }),
    __metadata("design:type", Object)
], OrdemServico.prototype, "pecas_utilizadas", void 0);
__decorate([
    Column({ type: "numeric", nullable: true }),
    __metadata("design:type", Object)
], OrdemServico.prototype, "horas_trabalhadas", void 0);
OrdemServico = __decorate([
    Entity("ordem_servico")
], OrdemServico);
export { OrdemServico };
//# sourceMappingURL=OrdemServico.js.map