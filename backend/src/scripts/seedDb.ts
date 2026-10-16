import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import argon2 from 'argon2';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function seedDatabase() {
  console.log('--- OptoPick Database Seeding ---');
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const dbName = process.env.DB_NAME || 'optopick_db';

  let connection;
  try {
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      database: dbName,
      multipleStatements: true,
    });
    console.log(`Connected to database '${dbName}' for seeding.`);

    // 1. Read dev_seed.sql
    const seedPath = path.resolve(__dirname, '../../../database/seeds/dev_seed.sql');
    console.log(`Reading seed SQL from: ${seedPath}`);
    const seedSql = fs.readFileSync(seedPath, 'utf-8');

    // 2. Execute dev_seed.sql
    await connection.query(seedSql);
    console.log('Base seed data inserted.');

    // 3. Generate Argon2id hashes for initial users
    console.log('Generating Argon2id hashes for initial credentials...');
    const adminHash = await argon2.hash('Admin@12345', {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
    });

    const staffHash = await argon2.hash('Staff@12345', {
      type: argon2.argon2id,
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

  } catch (error) {
    console.error('Database seeding failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

seedDatabase();
