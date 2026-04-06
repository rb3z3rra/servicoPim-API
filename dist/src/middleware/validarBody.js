export function validarBody(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                message: "Dados inválidos",
                errors: result.error.flatten().fieldErrors,
            });
        }
        req.body = result.data;
        next();
    };
}
//# sourceMappingURL=validarBody.js.map