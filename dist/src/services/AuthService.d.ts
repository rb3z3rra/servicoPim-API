import type { DataSource } from "typeorm";
import type { LoginDTO } from "../types/auth_type.js";
export declare class AuthService {
    private userRepo;
    constructor(appDataSource: DataSource);
    login(data: LoginDTO): Promise<{
        usuario: {
            id: string;
            nome: string;
            email: string;
            perfil: import("../types/usr_perfil.js").Perfil;
            setor: string;
            ativo: boolean;
        };
        accessToken: string;
        refreshToken: string;
    }>;
}
//# sourceMappingURL=AuthService.d.ts.map