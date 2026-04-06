import type { DataSource } from "typeorm";
import { Equipamento } from "../entities/Equipamento.js";
export declare class EquipamentoService {
    private equipamentoRepo;
    constructor(appDataSource: DataSource);
    getAll(): Promise<Equipamento[]>;
    getById(id: number): Promise<Equipamento>;
    getByCodigo(codigo: string): Promise<Equipamento>;
    createEquipamento(data: Equipamento): Promise<Equipamento>;
    updateEquipamento(id: number, data: Partial<Equipamento>): Promise<Equipamento>;
    deleteEquipamento(id: number): Promise<void>;
}
//# sourceMappingURL=EquipamentoService.d.ts.map