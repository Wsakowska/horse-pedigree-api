module.exports = {
    test: {
    client: 'pg', 
    connection: {
      host: 'localhost',
      database: 'horse_pedigree_test',
      user: 'user',
      password: 'password',
      port: 5432
    },
    migrations: {
      directory: './src/migrations'
    },
    seeds: {
      directory: './src/seeds'
    }
  },
  development: {
    client: 'pg',
    connection: {
      host: 'localhost',
      user: 'user',
      password: 'password',
      database: 'horse_pedigree',
      port: 5432
    },
    migrations: {
      directory: './src/migrations'
    },
    seeds: {
      directory: './src/seeds'
    }
  }
};