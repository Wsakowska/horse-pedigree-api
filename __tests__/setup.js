const knex = require('knex');
const { v4: uuid } = require('uuid');

// Polyfill dla TextEncoder/TextDecoder jeśli nie są dostępne
if (typeof global.TextEncoder === 'undefined') {
  try {
    const { TextEncoder, TextDecoder } = require('whatwg-encoding');
    global.TextEncoder = TextEncoder;
    global.TextDecoder = TextDecoder;
  } catch (error) {
    // Fallback dla starszych wersji Node.js
    global.TextEncoder = global.TextEncoder || require('util').TextEncoder;
    global.TextDecoder = global.TextDecoder || require('util').TextDecoder;
  }
}

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

  try {
    await adminKnex.raw(`CREATE DATABASE "${testDbName}"`);
  } catch (error) {
    if (!error.message.includes('already exists')) {
      throw error;
    }
  }
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
  try {
    await testKnex.migrate.latest({ directory: './src/migrations' });
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }

  // Make testKnex available globally
  global.testKnex = testKnex;
});

beforeEach(async () => {
  // Truncate tables in order to respect foreign key constraints
  await testKnex.raw('TRUNCATE TABLE horses CASCADE');
  await testKnex.raw('TRUNCATE TABLE breeders CASCADE');
  await testKnex.raw('TRUNCATE TABLE countries CASCADE');
  await testKnex.raw('TRUNCATE TABLE breeds RESTART IDENTITY CASCADE');
  await testKnex.raw('TRUNCATE TABLE colors RESTART IDENTITY CASCADE');
});

afterAll(async () => {
  // Clean up the test database
  if (testKnex) {
    await testKnex.destroy();
  }
  
  const adminKnex = knex({
    client: 'pg',
    connection: {
      host: 'localhost',
      user: 'user',
      password: 'password',
      database: 'postgres',
      port: 5432
    },
    debug: false
  });
  
  try {
    await adminKnex.raw(`DROP DATABASE IF EXISTS "${testDbName}"`);
  } catch (error) {
    console.warn('Could not drop test database:', error.message);
  }
  
  await adminKnex.destroy();
});