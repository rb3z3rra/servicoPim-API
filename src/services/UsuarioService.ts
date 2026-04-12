import { AppError } from '../errors/AppError.js';
import type { Repository } from "typeorm";
import { Usuario } from "../entities/Usuario.js";
import type { DataSource } from "typeorm";
import bcrypt from "bcryptjs";

type UserInput = {
  nome: string;
  email: string;
  senha: string;
  perfil: Usuario["perfil"];
  setor?: string | null;
  ativo?: boolean;
};

type UserUpdateInput = Partial<UserInput>;

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
      throw new AppError("Usuário não encontrado");
    }

    return user;
  }

  async getByEmail(email: string): Promise<Usuario> {
    const user = await this.userRepo.findOne({
      where: { email },
      select: ["id", "nome", "email", "perfil", "setor", "ativo", "created_at"],
    });

    if (!user) {
      throw new AppError("Usuário não encontrado");
    }

    return user;
  }

  async createUser(data: UserInput): Promise<Usuario> {
    const usuarioExistente = await this.userRepo.findOne({
      where: { email: data.email },
    });

    if (usuarioExistente) {
      throw new AppError("Email já cadastrado");
    }

    const novoUsuario = this.userRepo.create({
      nome: data.nome,
      email: data.email,
      senha_hash: await bcrypt.hash(data.senha, 8),
      perfil: data.perfil,
      setor: data.setor ?? null,
      ativo: data.ativo ?? true,
    });

    await this.userRepo.save(novoUsuario);

    return novoUsuario;
  }

  async updateUser(id: string, data: UserUpdateInput): Promise<Usuario> {
    const user = await this.getById(id);

    if (data.email && data.email !== user.email) {
      const emailExistente = await this.userRepo.findOne({
        where: { email: data.email },
      });

      if (emailExistente) {
        throw new AppError("Email já cadastrado");
      }
    }

    if (data.senha) {
      user.senha_hash = await bcrypt.hash(data.senha, 8);
    }

    Object.assign(user, {
      nome: data.nome ?? user.nome,
      email: data.email ?? user.email,
      perfil: data.perfil ?? user.perfil,
      setor: data.setor ?? user.setor,
      ativo: data.ativo ?? user.ativo,
    });

    await this.userRepo.save(user);

    return user;
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.getById(id);
    user.ativo = false;
    await this.userRepo.save(user);
  }
}

 
