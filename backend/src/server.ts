import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import app from './app.js';
import { testConnection } from './config/db.js';

const PORT = parseInt(process.env.PORT || '5000', 10);

process.on('unhandledRejection', (reason) => {
  console.error('[Process] Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[Process] Uncaught Exception:', err);
});

async function startServer() {
  console.log('--- Initializing OptoPick Backend Service ---');

  const dbOk = await testConnection();
  if (!dbOk) {
    console.error('CRITICAL: Cannot establish connection to MySQL database.');
    process.exit(1);
  }
  console.log('MySQL Database connection pool established and verified.');

  app.listen(PORT, () => {
    console.log(`OptoPick REST API server listening at http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer();
