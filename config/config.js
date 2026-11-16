
require('dotenv').config();

const useSSL =
  process.env.DB_SSL === 'true' ||
  process.env.DB_SSL === '1' ||
  (process.env.DB_HOST && process.env.DB_HOST.includes('tidbcloud'));

const common = {
  username: process.env.DB_USER || 'lembrafarma',
  password: process.env.DB_PASSWORD || 'lembrafarma123',
  database: process.env.DB_NAME || 'lembrafarma',
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  logging: false
};

const mysqlDialectOptions = useSSL
  ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  : {};

module.exports = {
  development: {
    ...common,
    dialect: process.env.DB_DIALECT || 'mysql',
    ...(process.env.DB_DIALECT === 'mysql' ||
    (process.env.DB_HOST && process.env.DB_HOST.includes('tidbcloud'))
      ? { dialectOptions: mysqlDialectOptions }
      : {})
  },
  test: {
    ...common,
    dialect: 'sqlite',
    storage: ':memory:'
  },
  production: {
    ...common,
    dialect: process.env.DB_DIALECT || 'mysql',
    ...(process.env.DB_DIALECT === 'mysql' ||
    (process.env.DB_HOST && process.env.DB_HOST.includes('tidbcloud'))
      ? { dialectOptions: mysqlDialectOptions }
      : {})
  }
};
