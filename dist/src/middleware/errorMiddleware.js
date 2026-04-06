export function errorMiddleware(error, req, res, next) {
    console.error(error);
    return res.status(400).json({
        message: error.message,
    });
}
//# sourceMappingURL=errorMiddleware.js.map