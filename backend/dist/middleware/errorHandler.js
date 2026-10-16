"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
exports.notFoundHandler = notFoundHandler;
const zod_1 = require("zod");
function errorHandler(err, req, res, next) {
    console.error(`[Error] ${req.method} ${req.url}:`, err);
    if (err instanceof zod_1.ZodError) {
        const formattedErrors = err.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
        }));
        res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_FAILED',
                message: 'Invalid input parameters provided.',
                details: formattedErrors,
            }
        });
        return;
    }
    const statusCode = err.status || err.statusCode || 500;
    const message = err.message || 'An unexpected internal error occurred.';
    res.status(statusCode).json({
        success: false,
        error: {
            code: err.code || 'INTERNAL_SERVER_ERROR',
            message: process.env.NODE_ENV === 'production' && statusCode === 500 ? 'An unexpected server error occurred.' : message,
        }
    });
}
function notFoundHandler(req, res) {
    res.status(404).json({
        success: false,
        error: {
            code: 'ROUTE_NOT_FOUND',
            message: `Endpoint ${req.method} ${req.originalUrl} not found.`,
        }
    });
}
