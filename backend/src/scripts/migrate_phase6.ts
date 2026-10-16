import pool from '../config/db.js';

async function migratePhase6() {
  console.log('Running Phase 6 Database Migrations...');
  const conn = await pool.getConnection();

  try {
    // 1. Check and add supplier procurement columns
    const [supplierCols]: any = await conn.query(`SHOW COLUMNS FROM suppliers LIKE 'credit_terms'`);
    if (supplierCols.length === 0) {
      console.log('Adding procurement terms columns to suppliers table...');
      await conn.query(`
        ALTER TABLE suppliers
          ADD COLUMN credit_terms VARCHAR(100) DEFAULT 'Net 30 Days credit settlement from date of physical Goods Receipt at Nintavur',
          ADD COLUMN settlement_method VARCHAR(100) DEFAULT 'Direct Electronic Bank Transfer (Commercial Bank / HNB Sri Lanka)',
          ADD COLUMN lead_time VARCHAR(100) DEFAULT '2 to 3 Business Days via standard courier delivery to Indian Optician',
          ADD COLUMN warranty_terms VARCHAR(255) DEFAULT '12 months frame hinge warranty; 6 months hard multi-coating guarantee on lenses'
      `);
      console.log('✓ Added supplier procurement terms columns.');
    } else {
      console.log('✓ Supplier procurement terms columns already present.');
    }

    // 2. Check and create customer_profile_history table
    console.log('Creating customer_profile_history table if not exists...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS customer_profile_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_id INT NOT NULL,
        changed_by_user_id INT NULL,
        changed_by_name VARCHAR(100) NULL,
        previous_full_name VARCHAR(100) NULL,
        previous_phone_number VARCHAR(20) NULL,
        previous_email VARCHAR(100) NULL,
        previous_address TEXT NULL,
        previous_age INT NULL,
        previous_gender ENUM('MALE', 'FEMALE', 'OTHER') NULL,
        previous_occupation VARCHAR(100) NULL,
        previous_preferences_notes TEXT NULL,
        change_reason VARCHAR(255) DEFAULT 'Returning patient profile update',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
        INDEX idx_hist_customer (customer_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ customer_profile_history table ready.');

    console.log('All Phase 6 migrations completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    conn.release();
    process.exit(0);
  }
}

migratePhase6();
