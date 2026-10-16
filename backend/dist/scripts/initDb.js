"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promise_1 = __importDefault(require("mysql2/promise"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
async function initDatabase() {
    console.log('--- OptoPick Database Initialization ---');
    const host = process.env.DB_HOST || '127.0.0.1';
    const port = parseInt(process.env.DB_PORT || '3306', 10);
    const user = process.env.DB_USER || 'root';
    const password = process.env.DB_PASSWORD || '';
    const dbName = process.env.DB_NAME || 'optopick_db';
    console.log(`Connecting to MySQL host ${host}:${port} as user '${user}'...`);
    let connection;
    try {
        connection = await promise_1.default.createConnection({
            host,
            port,
            user,
            password,
            multipleStatements: true,
        });
        console.log('Connected to MySQL server successfully.');
        // 1. Create database if it does not exist
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
        console.log(`Database '${dbName}' verified/created.`);
        // 2. Select database
        await connection.changeUser({ database: dbName });
        // 3. Read schema.sql
        const schemaPath = path_1.default.resolve(__dirname, '../../../database/schema.sql');
        console.log(`Reading DDL schema from: ${schemaPath}`);
        const schemaSql = fs_1.default.readFileSync(schemaPath, 'utf-8');
        // 4. Execute schema
        console.log('Executing schema DDL statements...');
        await connection.query(schemaSql);
        console.log('All tables, keys, and indexes created successfully in MySQL!');
    }
    catch (error) {
        console.error('Database initialization failed:', error);
        process.exit(1);
    }
    finally {
        if (connection) {
            await connection.end();
        }
    }
}
initDatabase();
