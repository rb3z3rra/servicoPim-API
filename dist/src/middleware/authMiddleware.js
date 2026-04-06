import jwt from "jsonwebtoken";
export function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: "Token não informado" });
    }
    const [, token] = authHeader.split(" ");
    if (!token) {
        return res.status(401).json({ message: "Token inválido" });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = {
            id: decoded.sub,
            email: decoded.email,
            perfil: decoded.perfil,
        };
        next();
    }
    catch {
        return res.status(401).json({ message: "Token inválido ou expirado" });
    }
}
//# sourceMappingURL=authMiddleware.js.map