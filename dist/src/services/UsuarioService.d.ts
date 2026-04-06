import { Usuario } from "../entities/Usuario.js";
import type { DataSource } from "typeorm";
export declare class UsuarioService {
    private userRepo;
    constructor(appDataSource: DataSource);
    getAll(): Promise<Usuario[]>;
    getById(id: string): Promise<Usuario>;
    getByEmail(email: string): Promise<Usuario>;
    createUser(data: Usuario): Promise<Usuario>;
    updateUser(id: string, data: Partial<Usuario>): Promise<Usuario>;
    deleteUser(id: string): Promise<void>;
}
//# sourceMappingURL=UsuarioService.d.ts.map