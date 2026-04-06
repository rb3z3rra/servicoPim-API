import { Usuario } from "../entities/Usuario.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
export class AuthService {
    userRepo;
    constructor(appDataSource) {
        this.userRepo = appDataSource.getRepository(Usuario);
    }
    async login(data) {
        const usuario = await this.userRepo.findOne({
            where: { email: data.email },
            select: [
                "id",
                "nome",
                "email",
                "senha_hash",
                "perfil",
                "setor",
                "ativo",
                "created_at",
            ],
        });
        if (!usuario) {
            throw new Error("Email ou senha inválidos");
        }
        const senhaCorreta = await bcrypt.compare(data.senha, usuario.senha_hash);
        if (!senhaCorreta) {
            throw new Error("Email ou senha inválidos");
        }
        const accessToken = jwt.sign({
            sub: usuario.id,
            email: usuario.email,
            perfil: usuario.perfil,
        }, process.env.JWT_SECRET, {
            expiresIn: "1d",
        });
        const refreshToken = jwt.sign({
            sub: usuario.id,
        }, process.env.JWT_REFRESH_SECRET, {
            expiresIn: "7d",
        });
        return {
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                perfil: usuario.perfil,
                setor: usuario.setor,
                ativo: usuario.ativo,
            },
            accessToken,
            refreshToken,
        };
    }
}
//# sourceMappingURL=AuthService.js.map