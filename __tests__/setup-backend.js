const knex = require('knex');
const { v4: uuid } = require('uuid');

// Polyfill dla TextEncoder/TextDecoder
global.TextEncoder = global.TextEncoder || require('util').TextEncoder;
global.TextDecoder = global.TextDecoder || require('util').TextDecoder;

const testDbName = `test_horse_pedigree_${uuid().replace(/-/g, '_')}`;
let testKnex;

beforeAll(async () => {
  console.log('=== SETTING UP TEST DATABASE ===');
  
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
    debug: false
  });

  try {
    await adminKnex.raw(`CREATE DATABASE "${testDbName}"`);
    console.log(`Created test database: ${testDbName}`);
  } catch (error) {
    if (!error.message.includes('already exists')) {
      throw error;
    }
    console.log(`Test database already exists: ${testDbName}`);
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
    debug: false
  });

  // Run migrations
  console.log('Running migrations...');
  await testKnex.migrate.latest({ directory: './src/migrations' });
  console.log('Migrations completed');

  // Make testKnex available globally
  global.testKnex = testKnex;
  console.log('=== TEST DATABASE READY ===');
}, 60000);

beforeEach(async () => {
  console.log('\n--- Cleaning tables before test ---');
  
  try {
    // Najpierw sprawdź co jest w tabelach
    const horsesCount = await testKnex('horses').count('* as count').first();
    const breedersCount = await testKnex('breeders').count('* as count').first();
    const countriesCount = await testKnex('countries').count('* as count').first();
    const breedsCount = await testKnex('breeds').count('* as count').first();
    const colorsCount = await testKnex('colors').count('* as count').first();
    
    console.log('Before cleanup:', {
      horses: horsesCount.count,
      breeders: breedersCount.count,
      countries: countriesCount.count,
      breeds: breedsCount.count,
      colors: colorsCount.count
    });
    
    // Wyczyść w odpowiedniej kolejności
    await testKnex.raw('DELETE FROM horses');
    await testKnex.raw('DELETE FROM breeders');
    await testKnex.raw('DELETE FROM countries');
    await testKnex.raw('DELETE FROM breeds');
    await testKnex.raw('DELETE FROM colors');
    
    // Reset sequences
    await testKnex.raw('ALTER SEQUENCE horses_id_seq RESTART WITH 1');
    await testKnex.raw('ALTER SEQUENCE breeders_id_seq RESTART WITH 1');
    await testKnex.raw('ALTER SEQUENCE breeds_id_seq RESTART WITH 1');
    await testKnex.raw('ALTER SEQUENCE colors_id_seq RESTART WITH 1');
    
    console.log('Tables cleaned and sequences reset');
  } catch (error) {
    console.error('Error during cleanup:', error);
    throw error;
  }
});

afterAll(async () => {
  console.log('\n=== CLEANING UP TEST DATABASE ===');
  
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
    // Terminate connections to the test database
    await adminKnex.raw(`
      SELECT pg_terminate_backend(pid) 
      FROM pg_stat_activity 
      WHERE datname = '${testDbName}' AND pid <> pg_backend_pid()
    `);
    await adminKnex.raw(`DROP DATABASE IF EXISTS "${testDbName}"`);
    console.log(`Dropped test database: ${testDbName}`);
  } catch (error) {
    console.warn('Could not drop test database:', error.message);
  }
  
  await adminKnex.destroy();
  console.log('=== CLEANUP COMPLETE ===');
}, 60000);