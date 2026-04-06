import type { Request, Response } from "express";
export declare class OrdemServicoController {
    create(req: Request, res: Response): Promise<Response>;
    getAll(req: Request, res: Response): Promise<Response>;
    getById(req: Request, res: Response): Promise<Response>;
    atribuirTecnico(req: Request, res: Response): Promise<Response>;
    atualizarStatus(req: Request, res: Response): Promise<Response>;
    concluir(req: Request, res: Response): Promise<Response>;
}
//# sourceMappingURL=OrdemServicoController.d.ts.map