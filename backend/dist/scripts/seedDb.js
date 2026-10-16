"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promise_1 = __importDefault(require("mysql2/promise"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const argon2_1 = __importDefault(require("argon2"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
async function seedDatabase() {
    console.log('--- OptoPick Database Seeding ---');
    const host = process.env.DB_HOST || '127.0.0.1';
    const port = parseInt(process.env.DB_PORT || '3306', 10);
    const user = process.env.DB_USER || 'root';
    const password = process.env.DB_PASSWORD || '';
    const dbName = process.env.DB_NAME || 'optopick_db';
    let connection;
    try {
        connection = await promise_1.default.createConnection({
            host,
            port,
            user,
            password,
            database: dbName,
            multipleStatements: true,
        });
        console.log(`Connected to database '${dbName}' for seeding.`);
        // 1. Read dev_seed.sql
        const seedPath = path_1.default.resolve(__dirname, '../../../database/seeds/dev_seed.sql');
        console.log(`Reading seed SQL from: ${seedPath}`);
        const seedSql = fs_1.default.readFileSync(seedPath, 'utf-8');
        // 2. Execute dev_seed.sql
        await connection.query(seedSql);
        console.log('Base seed data inserted.');
        // 3. Generate Argon2id hashes for initial users
        console.log('Generating Argon2id hashes for initial credentials...');
        const adminHash = await argon2_1.default.hash('Admin@12345', {
            type: argon2_1.default.argon2id,
            memoryCost: 65536,
            timeCost: 3,
        });
        const staffHash = await argon2_1.default.hash('Staff@12345', {
            type: argon2_1.default.argon2id,
            memoryCost: 65536,
            timeCost: 3,
        });
        // 4. Update users with valid hashes
        await connection.query('UPDATE users SET password_hash = ? WHERE username = ?', [adminHash, 'optometrist']);
        await connection.query('UPDATE users SET password_hash = ? WHERE username = ?', [staffHash, 'staff']);
        console.log('Updated user accounts with verified Argon2id credentials:');
        console.log(' - Admin / Optometrist: optometrist / Admin@12345');
        console.log(' - Optical Staff:      staff / Staff@12345');
        console.log('--- Database Seeding Completed Successfully ---');
    }
    catch (error) {
        console.error('Database seeding failed:', error);
        process.exit(1);
    }
    finally {
        if (connection) {
            await connection.end();
        }
    }
}
seedDatabase();
