import type { Request, Response } from "express";
import { UsuarioService } from "../services/UsuarioService.js";
import { appDataSource } from "../database/appDataSource.js";
import { Perfil } from "../types/Perfil.js";

const usuarioService = new UsuarioService(appDataSource);

export class UsuarioController {
  // POST /usuarios — acesso já controlado pelo ensureRole(SUPERVISOR) na rota
  async create(req: Request, res: Response): Promise<Response> {
    const data = req.body;
    const usuario = await usuarioService.createUser(data);
    return res.status(201).json(usuario);
  }

  // GET /usuarios — acesso já controlado pelo ensureRole(SUPERVISOR) na rota
  async getAll(req: Request, res: Response): Promise<Response> {
    const usuarios = await usuarioService.getAll();
    return res.status(200).json(usuarios);
  }

  // GET /usuarios/:id — acesso já controlado pelo ensureRole(SUPERVISOR) na rota
  async getById(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const usuario = await usuarioService.getById(id as string);
    return res.status(200).json(usuario);
  }

  async getDetails(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const usuario = await usuarioService.getDetailsById(id as string);
    return res.status(200).json(usuario);
  }

  // PUT /usuarios/:id — SUPERVISOR pode editar qualquer um; usuario só edita a si mesmo
  async update(req: Request, res: Response): Promise<Response> {
    const isSupervisor = req.auth?.perfil === Perfil.SUPERVISOR;
    const isOwnUser = req.auth?.sub === req.params.id;

    if (!isSupervisor && !isOwnUser) {
      return res.status(403).json({ message: "Acesso negado: você só pode editar seu próprio perfil" });
    }

    if (!isSupervisor) {
      const camposRestritos = ["perfil", "ativo", "matricula"].filter((field) => field in req.body);

      if (camposRestritos.length > 0) {
        return res.status(403).json({
          message: "Acesso negado: campos administrativos só podem ser alterados por supervisor",
        });
      }
    }

    const { id } = req.params;
    const data = req.body;
    const usuario = await usuarioService.updateUser(id as string, data);
    return res.status(200).json(usuario);
  }

  // DELETE /usuarios/:id — acesso já controlado pelo ensureRole(SUPERVISOR) na rota
  async delete(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    await usuarioService.deleteUser(id as string);
    return res.status(204).send();
  }
}
