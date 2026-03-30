import type { Request, Response } from "express";
import { UsuarioService } from "../services/UsuarioService.js";
import { appDataSource } from "../database/appDataSource.js";

const usuarioService = new UsuarioService(appDataSource);

export class UsuarioController {
  async create(req: Request, res: Response): Promise<Response> {
    const data = req.body;

    const usuario = await usuarioService.createUser(data);

    return res.status(201).json(usuario);
  }

  async getAll(req: Request, res: Response): Promise<Response> {
    const usuarios = await usuarioService.getAll();

    return res.status(200).json(usuarios);
  }

  async getById(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    const usuario = await usuarioService.getById(id as string);

    return res.status(200).json(usuario);
  }

  async update(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const data = req.body;

    const usuario = await usuarioService.updateUser(id as string, data);

    return res.status(200).json(usuario);
  }

  async delete(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    await usuarioService.deleteUser(id as string);

    return res.status(204).send();
  }
}