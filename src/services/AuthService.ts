import type { DataSource, Repository } from "typeorm";
import { Usuario } from "../entities/Usuario.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppError } from "../errors/AppError.js";

type LoginDTO = {
  email: string;
  senha: string;
};

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
      throw new AppError("Email ou senha inválidos", 401);
    }

    const senhaCorreta = await bcrypt.compare(data.senha, usuario.senha_hash);

    if (!senhaCorreta) {
      throw new AppError("Email ou senha inválidos", 401);
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

    const refreshToken = jwt.sign(
      { sub: usuario.id },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET as string,
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
      token,
      refreshToken,
    };
  }

  async refreshToken(tokenAntigo: string) {
    if (!tokenAntigo) throw new AppError("Refresh token não fornecido", 401);

    let payload: any;
    try {
      payload = jwt.verify(
        tokenAntigo,
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET as string
      );
    } catch (error) {
      throw new AppError("Refresh token inválido ou expirado", 401);
    }

    const usuario = await this.userRepo.findOne({
      where: { id: payload.sub },
    });

    if (!usuario) throw new AppError("Usuário não encontrado", 404);
    if (!usuario.ativo) throw new AppError("Usuário inativo", 403);

    const novoToken = jwt.sign(
      {
        sub: usuario.id,
        email: usuario.email,
        perfil: usuario.perfil,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" }
    );

    const novoRefreshToken = jwt.sign(
      { sub: usuario.id },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    return {
      token: novoToken,
      refreshToken: novoRefreshToken,
    };
  }
}