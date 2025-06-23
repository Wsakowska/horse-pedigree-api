module.exports = {
  test: {
    client: 'pg', 
    connection: {
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'horse_pedigree_test',
      user: process.env.DB_USER || 'user',
      password: process.env.DB_PASSWORD || 'password',
      port: process.env.DB_PORT || 5433
    },
    migrations: {
      directory: './src/migrations'
    },
    seeds: {
      directory: './src/seeds'
    },
    pool: {
      min: 1,
      max: 5
    },
    debug: false
  },
  development: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'user',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'horse_pedigree',
      port: process.env.DB_PORT || 5432
    },
    migrations: {
      directory: './src/migrations'
    },
    seeds: {
      directory: './src/seeds'
    },
    pool: {
      min: 2,
      max: 10
    },
    debug: true
  },
  production: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 5432,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    },
    migrations: {
      directory: './src/migrations'
    },
    seeds: {
      directory: './src/seeds'
    },
    pool: {
      min: 2,
      max: 20
    },
    debug: false
  }
};