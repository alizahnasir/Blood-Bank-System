const sql = require('mssql');
require('dotenv').config();

const useTrustedConnection = process.env.TRUSTED_CONNECTION === 'true';
const useEncrypt = process.env.DB_ENCRYPT === 'true';

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE || 'blood_bank',
  options: {
    encrypt: useEncrypt,
    trustServerCertificate: !useEncrypt,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

if (useTrustedConnection) {
  // Local Windows + SQL Express
  config.driver = 'msnodesqlv8';
  config.options.trustedConnection = true;
  config.options.encrypt = false;
} else {
  // Cloud (Azure SQL) — uses default tedious driver, works on Linux hosts
  config.user = process.env.DB_USER;
  config.password = process.env.DB_PASSWORD;
  config.port = parseInt(process.env.DB_PORT, 10) || 1433;
}

if (!config.server) {
  console.error('Database connection failed: DB_SERVER is not set in .env');
  process.exit(1);
}

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then((pool) => {
    console.log(`Connected to SQL Server (${config.database})`);
    return pool;
  })
  .catch((err) => {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  });

module.exports = {
  sql,
  poolPromise,
};
