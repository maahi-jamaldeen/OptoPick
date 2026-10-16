"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../.env') });
const app_js_1 = __importDefault(require("./app.js"));
const db_js_1 = require("./config/db.js");
const PORT = parseInt(process.env.PORT || '5000', 10);
process.on('unhandledRejection', (reason) => {
    console.error('[Process] Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
    console.error('[Process] Uncaught Exception:', err);
});
async function startServer() {
    console.log('--- Initializing OptoPick Backend Service ---');
    const dbOk = await (0, db_js_1.testConnection)();
    if (!dbOk) {
        console.error('CRITICAL: Cannot establish connection to MySQL database.');
        process.exit(1);
    }
    console.log('MySQL Database connection pool established and verified.');
    app_js_1.default.listen(PORT, () => {
        console.log(`OptoPick REST API server listening at http://localhost:${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
}
startServer();
