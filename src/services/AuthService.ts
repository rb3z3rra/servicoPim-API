import type { DataSource, Repository } from "typeorm";
import { Usuario } from "../entities/Usuario.js";
import { RefreshToken } from "../entities/RefreshToken.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createHash, randomUUID } from "node:crypto";
import type { LoginDTO } from "../types/auth_type.js";
import { AppError } from "../errors/AppError.js";
import { env } from "../config/env.js";

export class AuthService {
  private userRepo: Repository<Usuario>;
  private refreshTokenRepo: Repository<RefreshToken>;

  constructor(appDataSource: DataSource) {
    this.userRepo = appDataSource.getRepository(Usuario);
    this.refreshTokenRepo = appDataSource.getRepository(RefreshToken);
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
      { expiresIn: "15m" }
    );

    const refreshToken = await this.issueRefreshToken(usuario);

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
    let decoded: { sub: string; jti?: string; exp?: number };
    try {
      decoded = jwt.verify(
        token,
        env.JWT_REFRESH_SECRET
      ) as { sub: string; jti?: string; exp?: number };
    } catch {
      throw new AppError("Refresh Token inválido ou expirado", 400);
    }

    if (!decoded.jti) {
      throw new AppError("Refresh Token inválido ou expirado", 400);
    }

    const userId = decoded.sub;

    const refreshToken = await this.refreshTokenRepo.findOne({
      where: { jti: decoded.jti },
      relations: ["usuario"],
    });

    if (
      !refreshToken ||
      refreshToken.revokedAt ||
      refreshToken.usuario.id !== userId ||
      refreshToken.tokenHash !== this.hashToken(token) ||
      refreshToken.expiresAt.getTime() <= Date.now()
    ) {
      throw new AppError("Refresh Token inválido ou expirado", 400);
    }

    const usuario = await this.userRepo.findOne({
      where: { id: userId },
    });

    if (!usuario || !usuario.ativo) {
      refreshToken.revokedAt = new Date();
      await this.refreshTokenRepo.save(refreshToken);
      throw new AppError("Usuário inválido ou inativo", 401);
    }

    const accessToken = jwt.sign(
      {
        sub: usuario.id,
        email: usuario.email,
        perfil: usuario.perfil,
      },
      env.JWT_ACCESS_SECRET,
      { expiresIn: "15m" }
    );

    refreshToken.revokedAt = new Date();
    await this.refreshTokenRepo.save(refreshToken);

    const nextRefreshToken = await this.issueRefreshToken(usuario);

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
    refreshToken: nextRefreshToken,
  };

  }

  async revokeRefreshToken(token: string | undefined): Promise<void> {
    if (!token) return;

    try {
      const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as { jti?: string };
      if (!decoded.jti) return;

      const refreshToken = await this.refreshTokenRepo.findOne({
        where: { jti: decoded.jti },
      });

      if (!refreshToken || refreshToken.revokedAt) return;

      refreshToken.revokedAt = new Date();
      await this.refreshTokenRepo.save(refreshToken);
    } catch {
      return;
    }
  }

  private async issueRefreshToken(usuario: Usuario): Promise<string> {
    const jti = randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const token = jwt.sign(
      {
        sub: usuario.id,
        jti,
      },
      env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    await this.refreshTokenRepo.save(
      this.refreshTokenRepo.create({
        jti,
        tokenHash: this.hashToken(token),
        usuario,
        expiresAt,
        revokedAt: null,
      })
    );

    return token;
  }

  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }
}
