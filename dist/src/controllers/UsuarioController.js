import { UsuarioService } from "../services/UsuarioService.js";
import { appDataSource } from "../database/appDataSource.js";
const usuarioService = new UsuarioService(appDataSource);
export class UsuarioController {
    async create(req, res) {
        const data = req.body;
        const usuario = await usuarioService.createUser(data);
        return res.status(201).json(usuario);
    }
    async getAll(req, res) {
        const usuarios = await usuarioService.getAll();
        return res.status(200).json(usuarios);
    }
    async getById(req, res) {
        const { id } = req.params;
        const usuario = await usuarioService.getById(id);
        return res.status(200).json(usuario);
    }
    async update(req, res) {
        const { id } = req.params;
        const data = req.body;
        const usuario = await usuarioService.updateUser(id, data);
        return res.status(200).json(usuario);
    }
    async delete(req, res) {
        const { id } = req.params;
        await usuarioService.deleteUser(id);
        return res.status(204).send();
    }
}
//# sourceMappingURL=UsuarioController.js.map