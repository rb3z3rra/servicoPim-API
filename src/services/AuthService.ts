import type { DataSource, Repository } from "typeorm";
import { Usuario } from "../entities/Usuario.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { LoginDTO } from "../types/auth_type.js";



export class AuthService {
  private userRepo: Repository<Usuario>;

  constructor(appDataSource: DataSource) {
    this.userRepo = appDataSource.getRepository(Usuario);
  }

  async login(data: LoginDTO) {
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

    const token = jwt.sign(
      {
        sub: usuario.id,
        email: usuario.email,
        perfil: usuario.perfil,
      },
      process.env.JWT_SECRET as string,
      {
        expiresIn: "1d",
      }
    );

    return {
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
        setor: usuario.setor,
        ativo: usuario.ativo,
      },
      token,
    };
  }
}