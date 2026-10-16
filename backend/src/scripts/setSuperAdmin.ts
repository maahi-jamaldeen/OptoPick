import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function run() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || 'root';
  const database = process.env.DB_NAME || 'optopick_db';

  const conn = await mysql.createConnection({ host, port, user, password, database });
  console.log('Connected to MySQL.');

  try {
    await conn.query("ALTER TABLE users MODIFY COLUMN role ENUM('SUPER_ADMIN', 'ADMIN', 'STAFF') NOT NULL DEFAULT 'STAFF'");
    console.log('Altered users role enum to include SUPER_ADMIN.');

    await conn.query("UPDATE users SET role = 'SUPER_ADMIN' WHERE id = 1 OR username = 'optometrist'");
    console.log('Updated user 1 (optometrist) to SUPER_ADMIN.');

    const [rows] = await conn.query("SELECT id, username, email, full_name, role FROM users");
    console.log('Users in database:', rows);
  } catch (err) {
    console.error('Error updating role:', err);
  } finally {
    await conn.end();
  }
}

run();
