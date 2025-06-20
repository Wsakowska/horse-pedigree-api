module.exports = {
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
    // seeds: {
    //   directory: './src/seeds'
    // }
  }
};