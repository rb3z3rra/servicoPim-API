import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";
export declare function validarBody(schema: ZodSchema): (req: Request, res: Response, next: NextFunction) => Response | void;
//# sourceMappingURL=validarBody.d.ts.map