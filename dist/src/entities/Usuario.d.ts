import { Perfil } from "../types/usr_perfil.js";
import { OrdemServico } from "./OrdemServico.js";
export declare class Usuario {
    id: string;
    nome: string;
    email: string;
    senha_hash: string;
    perfil: Perfil;
    setor: string;
    ativo: boolean;
    created_at: Date;
    ordensSolicitadas: OrdemServico[];
    ordensTecnico: OrdemServico[];
}
//# sourceMappingURL=Usuario.d.ts.map