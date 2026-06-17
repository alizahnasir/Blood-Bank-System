const sql = require('mssql');

const attempts = [
  {
    label: 'localhost\\SQLEXPRESS + msnodesqlv8',
    config: {
      server: 'localhost\\SQLEXPRESS',
      database: 'blood_bank',
      driver: 'msnodesqlv8',
      options: { trustedConnection: true, trustServerCertificate: true, encrypt: false },
    },
  },
  {
    label: 'named pipe',
    config: {
      server: 'np:\\\\.\\pipe\\MSSQL$SQLEXPRESS\\sql\\query',
      database: 'blood_bank',
      driver: 'msnodesqlv8',
      options: { trustedConnection: true, trustServerCertificate: true, encrypt: false },
    },
  },
  {
    label: 'localhost\\SQLEXPRESS + tedious (default)',
    config: {
      server: 'localhost\\SQLEXPRESS',
      database: 'blood_bank',
      options: { trustedConnection: true, trustServerCertificate: true, encrypt: false },
    },
  },
];

async function main() {
  for (const attempt of attempts) {
    try {
      const pool = await new sql.ConnectionPool(attempt.config).connect();
      console.log('SUCCESS:', attempt.label);
      await pool.close();
      return;
    } catch (err) {
      console.log('FAILED:', attempt.label, '-', err.message);
    }
  }
  process.exit(1);
}

main();
