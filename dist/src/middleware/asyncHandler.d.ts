import type { NextFunction, Request, Response } from "express";
type AsyncRoute = (req: Request, res: Response, next: NextFunction) => Promise<Response | void>;
export declare function asyncHandler(fn: AsyncRoute): (req: Request, res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=asyncHandler.d.ts.map