import { AppError } from '../errors/AppError.js';
import type { Repository } from "typeorm";
import { Usuario } from "../entities/Usuario.js";
import type { DataSource } from "typeorm";
import bcrypt from "bcryptjs";
import { OrdemServico } from "../entities/OrdemServico.js";
import { ApontamentoOS } from "../entities/ApontamentoOS.js";
import { StatusOs } from "../types/os_status.js";

type UserInput = {
  nome: string;
  email: string;
  matricula: string;
  senha: string;
  perfil: Usuario["perfil"];
  setor?: string | null;
  ativo?: boolean;
};

type UserUpdateInput = Partial<UserInput>;

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

  async createUser(data: UserInput): Promise<Usuario> {
    const usuarioExistente = await this.userRepo.findOne({
      where: [{ email: data.email }, { matricula: data.matricula }],
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
      matricula: data.matricula,
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
}

 
