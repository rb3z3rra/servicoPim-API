import { Usuario } from "../entities/Usuario.js";
import bcrypt from "bcryptjs";
export class UsuarioService {
    userRepo;
    constructor(appDataSource) {
        this.userRepo = appDataSource.getRepository(Usuario);
    }
    async getAll() {
        return await this.userRepo.find();
    }
    async getById(id) {
        const user = await this.userRepo.findOne({ where: { id } });
        if (!user) {
            throw new Error("Usuário não encontrado");
        }
        return user;
    }
    async getByEmail(email) {
        const user = await this.userRepo.findOne({
            where: { email },
            select: ["id", "nome", "email", "senha_hash", "perfil", "setor", "ativo", "created_at"],
        });
        if (!user) {
            throw new Error("Usuário não encontrado");
        }
        return user;
    }
    async createUser(data) {
        const usuarioExistente = await this.userRepo.findOne({
            where: { email: data.email },
        });
        if (usuarioExistente) {
            throw new Error("Email já cadastrado");
        }
        data.senha_hash = await bcrypt.hash(data.senha_hash, 8);
        const novoUsuario = this.userRepo.create(data);
        await this.userRepo.save(novoUsuario);
        return novoUsuario;
    }
    async updateUser(id, data) {
        const user = await this.getById(id);
        if (data.email && data.email !== user.email) {
            const emailExistente = await this.userRepo.findOne({
                where: { email: data.email },
            });
            if (emailExistente) {
                throw new Error("Email já cadastrado");
            }
        }
        if (data.senha_hash) {
            data.senha_hash = await bcrypt.hash(data.senha_hash, 8);
        }
        Object.assign(user, data);
        await this.userRepo.save(user);
        return user;
    }
    async deleteUser(id) {
        const user = await this.getById(id);
        await this.userRepo.remove(user);
    }
}
//# sourceMappingURL=UsuarioService.js.map