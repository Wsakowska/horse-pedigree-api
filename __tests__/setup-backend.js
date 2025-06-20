const knex = require('knex');

// Globalne zmienne dla testów
let testKnex;
let testDbName;

beforeAll(async () => {
  console.log('=== SETTING UP TEST DATABASE ===');
  
  // Unikalny testDbName dla każdego uruchomienia
  testDbName = `test_horse_pedigree_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
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
    console.error('Failed to create test database:', error);
    throw error;
  } finally {
    await adminKnex.destroy();
  }

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
    debug: false, // Wyłącz debug żeby nie zaśmiecać logów
    pool: {
      min: 1,
      max: 5
    }
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
    // Najpierw wyczyść tabele z foreign keys
    await testKnex.raw('DELETE FROM horses');
    await testKnex.raw('DELETE FROM breeders');
    await testKnex.raw('DELETE FROM countries');
    await testKnex.raw('DELETE FROM breeds');
    await testKnex.raw('DELETE FROM colors');
    
    // Reset sequences (AUTO_INCREMENT)
    await testKnex.raw('ALTER SEQUENCE IF EXISTS horses_id_seq RESTART WITH 1');
    await testKnex.raw('ALTER SEQUENCE IF EXISTS breeders_id_seq RESTART WITH 1');
    await testKnex.raw('ALTER SEQUENCE IF EXISTS breeds_id_seq RESTART WITH 1');
    await testKnex.raw('ALTER SEQUENCE IF EXISTS colors_id_seq RESTART WITH 1');
    
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
  
  if (testDbName) {
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
        WHERE datname = $1 AND pid <> pg_backend_pid()
      `, [testDbName]);
      
      await adminKnex.raw(`DROP DATABASE IF EXISTS "${testDbName}"`);
      console.log(`Dropped test database: ${testDbName}`);
    } catch (error) {
      console.warn('Could not drop test database:', error.message);
    } finally {
      await adminKnex.destroy();
    }
  }
  
  console.log('=== CLEANUP COMPLETE ===');
}, 60000);