
if (process.env.NODE_ENV !== 'test') {
  require('dotenv').config();
}
const fs = require('fs');
const path = require('path');

const dbHost = process.env.DB_HOST ? process.env.DB_HOST.trim() : '127.0.0.1';
if (!dbHost) {
  throw new Error('DB_HOST must not be empty.');
}
const dbPort = Number(process.env.DB_PORT || 3306);
if (!Number.isInteger(dbPort) || dbPort < 1 || dbPort > 65535) {
  throw new Error('DB_PORT must be an integer between 1 and 65535.');
}

const dbSsl = process.env.DB_SSL ? process.env.DB_SSL.toLowerCase() : '';
if (dbSsl && !['true', 'false', '1', '0'].includes(dbSsl)) {
  throw new Error('DB_SSL must be true, false, 1, or 0.');
}

const sslEnabled =
  dbSsl === 'true' ||
  dbSsl === '1' ||
  dbHost.toLowerCase().includes('tidbcloud');

function sslOptions() {
  const options = { rejectUnauthorized: true };
  if (process.env.DB_SSL_CA) {
    options.ca = fs.readFileSync(path.resolve(process.env.DB_SSL_CA));
  }
  return options;
}

const common = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: dbHost,
  port: dbPort,
  logging: false
};

const mysqlDialectOptions = sslEnabled
  ? {
      ssl: sslOptions()
    }
  : {};

module.exports = {
  development: {
    ...common,
    dialect: process.env.DB_DIALECT || 'mysql',
    dialectOptions: mysqlDialectOptions
  },
  test: {
    username: undefined,
    password: undefined,
    database: undefined,
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false
  },
  production: {
    ...common,
    dialect: process.env.DB_DIALECT || 'mysql',
    dialectOptions: mysqlDialectOptions
  }
};
