"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("express-async-errors");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const authRoutes_js_1 = __importDefault(require("./routes/authRoutes.js"));
const userRoutes_js_1 = __importDefault(require("./routes/userRoutes.js"));
const customerRoutes_js_1 = __importDefault(require("./routes/customerRoutes.js"));
const examRoutes_js_1 = __importDefault(require("./routes/examRoutes.js"));
const productRoutes_js_1 = __importDefault(require("./routes/productRoutes.js"));
const inventoryRoutes_js_1 = __importDefault(require("./routes/inventoryRoutes.js"));
const saleRoutes_js_1 = __importDefault(require("./routes/saleRoutes.js"));
const aiRoutes_js_1 = __importDefault(require("./routes/aiRoutes.js"));
const dashboardRoutes_js_1 = __importDefault(require("./routes/dashboardRoutes.js"));
const errorHandler_js_1 = require("./middleware/errorHandler.js");
const app = (0, express_1.default)();
// Security and CORS
app.use((0, cors_1.default)({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
// Rate limiting on sensitive authentication routes
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many authentication attempts. Please try again later.' }
    }
});
// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'UP',
        service: 'OptoPick Intelligent Optical Center Management System',
        client: 'Indian Optician, Nintavur, Sri Lanka',
        timestamp: new Date().toISOString(),
    });
});
// API Routes
app.use('/api/auth', authLimiter, authRoutes_js_1.default);
app.use('/api/users', userRoutes_js_1.default);
app.use('/api/customers', customerRoutes_js_1.default);
app.use('/api/examinations', examRoutes_js_1.default);
app.use('/api/products', productRoutes_js_1.default);
app.use('/api/inventory', inventoryRoutes_js_1.default);
app.use('/api/sales', saleRoutes_js_1.default);
app.use('/api/ai', aiRoutes_js_1.default);
app.use('/api/dashboard', dashboardRoutes_js_1.default);
// Centralized error handling
app.use(errorHandler_js_1.notFoundHandler);
app.use(errorHandler_js_1.errorHandler);
exports.default = app;
