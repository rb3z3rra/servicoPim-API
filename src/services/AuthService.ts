import type { DataSource, Repository } from "typeorm";
import { Usuario } from "../entities/Usuario.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { LoginDTO } from "../types/auth_type.js";
import { AppError } from "../errors/AppError.js";
import { env } from "../config/env.js";

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
      throw new AppError("Email ou senha inválidos", 400);
    }

    if (!usuario.ativo) {
      throw new AppError("Usuário inativo", 403);
    }

    const senhaCorreta = await bcrypt.compare(data.senha, usuario.senha_hash);

    if (!senhaCorreta) {
      throw new AppError("Email ou senha inválidos", 400);
    }

    const accessToken = jwt.sign(
      {
        sub: usuario.id,
        email: usuario.email,
        perfil: usuario.perfil,
      },
      env.JWT_ACCESS_SECRET,
      { expiresIn: (process.env.JWT_ACCESS_EXPIRES ?? "24h") as string }
    );

    const refreshToken = jwt.sign(
      {
        sub: usuario.id,
      },
      env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
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
      accessToken,
      refreshToken,
    };
  }

  async refresh(token: string) {
    let decoded;
    try {
      decoded = jwt.verify(
        token,
        env.JWT_REFRESH_SECRET
      ) as { sub: string };
    } catch {
      throw new AppError("Refresh Token inválido ou expirado", 400);
    }

    const userId = decoded.sub;

    const usuario = await this.userRepo.findOne({
      where: { id: userId },
    });

    if (!usuario || !usuario.ativo) {
      throw new AppError("Usuário inválido ou inativo", 401);
    }

    const accessToken = jwt.sign(
      {
        sub: usuario.id,
        email: usuario.email,
        perfil: usuario.perfil,
      },
      env.JWT_ACCESS_SECRET,
      { expiresIn: (process.env.JWT_ACCESS_EXPIRES ?? "24h") as string }
    );

    const refreshToken = jwt.sign(
      {
        sub: usuario.id,
      },
      env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    return {
      accessToken,
      refreshToken,
    };
  }
}
