import type { Repository } from "typeorm";
import { Usuario } from "../entities/Usuario.js";
import type { DataSource } from "typeorm";
import bcrypt from "bcryptjs";

export class UsuarioService {
  private userRepo: Repository<Usuario>;

  constructor(appDataSource: DataSource) {
    this.userRepo = appDataSource.getRepository(Usuario);
  }

  async getAll(): Promise<Usuario[]> {
    return await this.userRepo.find();
  }

  async getById(id: string): Promise<Usuario> {
    const user = await this.userRepo.findOne({ where: { id } });

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    return user;
  }

  async getByEmail(email: string): Promise<Usuario> {
    const user = await this.userRepo.findOne({
      where: { email },
      select: ["id", "nome", "email", "senha_hash", "perfil", "setor", "ativo", "created_at"],
    });

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    return user;
  }

  async createUser(data: Usuario): Promise<Usuario> {
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

  async updateUser(id: string, data: Partial<Usuario>): Promise<Usuario> {
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

  async deleteUser(id: string): Promise<void> {
    const user = await this.getById(id);

    await this.userRepo.remove(user);
  }
}