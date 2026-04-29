import { AppError } from '../errors/AppError.js';
import type { Repository } from "typeorm";
import { Usuario } from "../entities/Usuario.js";
import type { DataSource } from "typeorm";
import bcrypt from "bcryptjs";
import { OrdemServico } from "../entities/OrdemServico.js";
import { ApontamentoOS } from "../entities/ApontamentoOS.js";
import { StatusOs } from "../types/os_status.js";
import { Perfil } from "../types/usr_perfil.js";

type UserInput = {
  nome: string;
  email: string;
  matricula?: string;
  senha: string;
  perfil: Usuario["perfil"];
  setor?: string | null;
  ativo?: boolean;
};

type UserUpdateInput = Partial<UserInput>;
type PerfilAtorAdministrativo = Perfil.SUPERVISOR | Perfil.GESTOR;

export class UsuarioService {
  private userRepo: Repository<Usuario>;
  private ordemServicoRepo: Repository<OrdemServico>;
  private apontamentoRepo: Repository<ApontamentoOS>;

  constructor(appDataSource: DataSource) {
    this.userRepo = appDataSource.getRepository(Usuario);
    this.ordemServicoRepo = appDataSource.getRepository(OrdemServico);
    this.apontamentoRepo = appDataSource.getRepository(ApontamentoOS);
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

  async getDetailsById(id: string) {
    const user = await this.getById(id);

    const [totalSolicitadas, totalAtribuidas, totalConcluidasComoTecnico, apontamentoResumo] =
      await Promise.all([
        this.ordemServicoRepo
          .createQueryBuilder("ordemServico")
          .leftJoin("ordemServico.solicitante", "solicitante")
          .where("solicitante.id = :id", { id })
          .getCount(),
        this.ordemServicoRepo
          .createQueryBuilder("ordemServico")
          .leftJoin("ordemServico.tecnico", "tecnico")
          .where("tecnico.id = :id", { id })
          .getCount(),
        this.ordemServicoRepo
          .createQueryBuilder("ordemServico")
          .leftJoin("ordemServico.tecnico", "tecnico")
          .where("tecnico.id = :id", { id })
          .andWhere("ordemServico.status = :status", { status: StatusOs.CONCLUIDA })
          .getCount(),
        this.apontamentoRepo
          .createQueryBuilder("apontamento")
          .select("COUNT(*)", "total_apontamentos")
          .addSelect(
            "COALESCE(SUM(EXTRACT(EPOCH FROM (apontamento.fim_em - apontamento.inicio_em)) / 3600), 0)",
            "total_horas_trabalhadas"
          )
          .where("apontamento.tecnico_id = :id", { id })
          .andWhere("apontamento.fim_em IS NOT NULL")
          .getRawOne<{ total_apontamentos: string; total_horas_trabalhadas: string }>(),
      ]);

    return {
      ...user,
      total_os_solicitadas: totalSolicitadas,
      total_os_atribuidas: totalAtribuidas,
      total_os_concluidas: totalConcluidasComoTecnico,
      total_apontamentos: Number(apontamentoResumo?.total_apontamentos ?? 0),
      total_horas_trabalhadas: Number(
        Number(apontamentoResumo?.total_horas_trabalhadas ?? 0).toFixed(2)
      ),
    };
  }

  async getByEmail(email: string): Promise<Usuario> {
    const user = await this.userRepo.findOne({
      where: { email },
      select: ["id", "nome", "email", "matricula", "perfil", "setor", "ativo", "created_at"],
    });

    if (!user) {
      throw new AppError("Usuário não encontrado");
    }

    return user;
  }

  async createUser(data: UserInput, actorPerfil?: PerfilAtorAdministrativo): Promise<Usuario> {
    if (actorPerfil) {
      this.assertPodeDefinirPerfil(actorPerfil, data.perfil);
    }

    const matricula = data.matricula?.trim() || await this.gerarMatricula();
    const usuarioExistente = await this.userRepo.findOne({
      where: [{ email: data.email }, { matricula }],
    });

    if (usuarioExistente) {
      if (usuarioExistente.email === data.email) {
        throw new AppError("Email já cadastrado");
      }

      throw new AppError("Matrícula já cadastrada");
    }

    const novoUsuario = this.userRepo.create({
      nome: data.nome,
      email: data.email,
      matricula,
      senha_hash: await bcrypt.hash(data.senha, 8),
      perfil: data.perfil,
      setor: data.setor ?? null,
      ativo: data.ativo ?? true,
    });

    await this.userRepo.save(novoUsuario);

    return novoUsuario;
  }

  async updateUser(
    id: string,
    data: UserUpdateInput,
    actorPerfil?: PerfilAtorAdministrativo
  ): Promise<Usuario> {
    const user = await this.getById(id);

    if (actorPerfil) {
      this.assertPodeEditarUsuario(actorPerfil, user, data);
    }

    if (data.email && data.email !== user.email) {
      const emailExistente = await this.userRepo.findOne({
        where: { email: data.email },
      });

      if (emailExistente) {
        throw new AppError("Email já cadastrado");
      }
    }

    if (data.matricula && data.matricula !== user.matricula) {
      const matriculaExistente = await this.userRepo.findOne({
        where: { matricula: data.matricula },
      });

      if (matriculaExistente) {
        throw new AppError("Matrícula já cadastrada");
      }
    }

    if (data.senha) {
      user.senha_hash = await bcrypt.hash(data.senha, 8);
    }

    Object.assign(user, {
      nome: data.nome ?? user.nome,
      email: data.email ?? user.email,
      matricula: data.matricula ?? user.matricula,
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

  private assertPodeEditarUsuario(
    actorPerfil: PerfilAtorAdministrativo,
    usuarioAtual: Usuario,
    data: UserUpdateInput
  ): void {
    if (actorPerfil === Perfil.SUPERVISOR && usuarioAtual.perfil === Perfil.GESTOR) {
      throw new AppError("Supervisor não pode editar usuário gestor", 403);
    }

    if (data.perfil) {
      this.assertPodeDefinirPerfil(actorPerfil, data.perfil);
    }
  }

  private assertPodeDefinirPerfil(
    actorPerfil: PerfilAtorAdministrativo,
    perfilDestino: Usuario["perfil"]
  ): void {
    const perfisPermitidos =
      actorPerfil === Perfil.GESTOR
        ? [Perfil.SUPERVISOR, Perfil.TECNICO, Perfil.SOLICITANTE]
        : [Perfil.TECNICO, Perfil.SOLICITANTE];

    if (!perfisPermitidos.includes(perfilDestino)) {
      throw new AppError("Perfil não permitido para o usuário autenticado", 403);
    }
  }

  private async gerarMatricula(): Promise<string> {
    const prefixo = "USR";
    const ultima = await this.userRepo
      .createQueryBuilder("usuario")
      .select("usuario.matricula", "matricula")
      .where("usuario.matricula LIKE :prefixo", { prefixo: `${prefixo}-%` })
      .orderBy("usuario.matricula", "DESC")
      .getRawOne<{ matricula?: string }>();

    const ultimoNumero = Number(ultima?.matricula?.replace(`${prefixo}-`, "") ?? 0);
    let proximoNumero = Number.isFinite(ultimoNumero) ? ultimoNumero + 1 : 1;

    while (true) {
      const matricula = `${prefixo}-${String(proximoNumero).padStart(6, "0")}`;
      const existente = await this.userRepo.findOne({ where: { matricula } });

      if (!existente) {
        return matricula;
      }

      proximoNumero++;
    }
  }
}

 
