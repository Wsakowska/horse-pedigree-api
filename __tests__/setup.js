const { TextEncoder, TextDecoder } = require('whatwg-encoding');
const knex = require('knex');
const { v4: uuid } = require('uuid');

// Polyfill TextEncoder and TextDecoder for jsdom
global.TextEncoder = global.TextEncoder || TextEncoder;
global.TextDecoder = global.TextDecoder || TextDecoder;

const testDbName = `test_horse_pedigree_${uuid().replace(/-/g, '_')}`;
let testKnex;

beforeAll(async () => {
  // Create a temporary database
  const adminKnex = knex({
    client: 'pg',
    connection: {
      host: 'localhost',
      user: 'user',
      password: 'password',
      database: 'postgres',
      port: 5432
    },
    debug: false // Disable query logging
  });

  await adminKnex.raw(`CREATE DATABASE ${testDbName}`);
  await adminKnex.destroy();

  // Connect to the test database
  testKnex = knex({
    client: 'pg',
    connection: {
      host: 'localhost',
      user: 'user',
      password: 'password',
      database: testDbName,
      port: 5432
    },
    debug: false // Disable query logging
  });

  // Run migrations
  await testKnex.migrate.latest({ directory: './src/migrations' });

  // Run seeds
  await testKnex.seed.run({ directory: './src/seeds' });

  // Make testKnex available globally
  global.testKnex = testKnex;
});

beforeEach(async () => {
  // Truncate tables in order to respect foreign key constraints
  await testKnex('horses').del();
  await testKnex('breeders').del();
  await testKnex('countries').del();
  await testKnex('breeds').del();
  await testKnex('colors').del();
});

afterAll(async () => {
  // Clean up the test database
  await testKnex.destroy();
  const adminKnex = knex({
    client: 'pg',
    connection: {
      host: 'localhost',
      user: 'user',
      password: 'password',
      database: 'postgres',
      port: 5432
    },
    debug: false // Disable query logging
  });
  await adminKnex.raw(`DROP DATABASE ${testDbName}`);
  await adminKnex.destroy();
});