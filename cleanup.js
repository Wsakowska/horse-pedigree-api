const knex = require('./src/config/db');

async function cleanupDuplicates() {
  console.log('🧹 Rozpoczynam czyszczenie duplikatów...');
  
  try {
    // 1. Usuń duplikaty ras (zachowaj tylko najstarsze wpisy)
    console.log('Czyszczenie duplikatów ras...');
    const deletedBreeds = await knex.raw(`
      DELETE FROM breeds 
      WHERE id NOT IN (
        SELECT MIN(id) 
        FROM breeds 
        GROUP BY name
      )
    `);
    console.log(`✅ Usunięto ${deletedBreeds.rowCount || 0} duplikatów ras`);
    
    // 2. Usuń duplikaty maści
    console.log('Czyszczenie duplikatów maści...');
    const deletedColors = await knex.raw(`
      DELETE FROM colors 
      WHERE id NOT IN (
        SELECT MIN(id) 
        FROM colors 
        GROUP BY name
      )
    `);
    console.log(`✅ Usunięto ${deletedColors.rowCount || 0} duplikatów maści`);
    
    // 3. Usuń duplikaty hodowców
    console.log('Czyszczenie duplikatów hodowców...');
    const deletedBreeders = await knex.raw(`
      DELETE FROM breeders 
      WHERE id NOT IN (
        SELECT MIN(id) 
        FROM breeders 
        GROUP BY name, country_code
      )
    `);
    console.log(`✅ Usunięto ${deletedBreeders.rowCount || 0} duplikatów hodowców`);
    
    // 4. Wyświetl statystyki po czyszczeniu
    console.log('\n📊 Statystyki po czyszczeniu:');
    
    const breedsCount = await knex('breeds').count('* as count').first();
    console.log(`Rasy: ${breedsCount.count}`);
    
    const colorsCount = await knex('colors').count('* as count').first();
    console.log(`Maści: ${colorsCount.count}`);
    
    const breedersCount = await knex('breeders').count('* as count').first();
    console.log(`Hodowcy: ${breedersCount.count}`);
    
    const horsesCount = await knex('horses').count('* as count').first();
    console.log(`Konie: ${horsesCount.count}`);
    
    console.log('\n✨ Czyszczenie zakończone pomyślnie!');
    
  } catch (error) {
    console.error('❌ Błąd podczas czyszczenia:', error);
    throw error;
  }
}

async function addUniqueConstraints() {
  console.log('🔒 Dodawanie ograniczeń unikalności...');
  
  try {
    // Sprawdź czy ograniczenia już istnieją
    const existingConstraints = await knex.raw(`
      SELECT constraint_name, table_name 
      FROM information_schema.table_constraints 
      WHERE constraint_type = 'UNIQUE' 
      AND table_schema = 'public'
    `);
    
    const constraintNames = existingConstraints.rows.map(row => row.constraint_name);
    
    // Dodaj unique constraint dla breeds.name
    if (!constraintNames.includes('breeds_name_unique')) {
      await knex.schema.table('breeds', (table) => {
        table.unique('name');
      });
      console.log('✅ Dodano unique constraint dla breeds.name');
    } else {
      console.log('ℹ️ Unique constraint dla breeds.name już istnieje');
    }
    
    // Dodaj unique constraint dla colors.name
    if (!constraintNames.includes('colors_name_unique')) {
      await knex.schema.table('colors', (table) => {
        table.unique('name');
      });
      console.log('✅ Dodano unique constraint dla colors.name');
    } else {
      console.log('ℹ️ Unique constraint dla colors.name już istnieje');
    }
    
    // Dodaj unique constraint dla breeders (name + country_code)
    if (!constraintNames.includes('breeders_name_country_code_unique')) {
      await knex.schema.table('breeders', (table) => {
        table.unique(['name', 'country_code']);
      });
      console.log('✅ Dodano unique constraint dla breeders (name + country_code)');
    } else {
      console.log('ℹ️ Unique constraint dla breeders już istnieje');
    }
    
    console.log('🔒 Ograniczenia unikalności zostały zaktualizowane!');
    
  } catch (error) {
    console.error('❌ Błąd podczas dodawania ograniczeń:', error);
    throw error;
  }
}

async function showCurrentData() {
  console.log('\n📋 Aktualne dane w bazie:');
  
  try {
    const breeds = await knex('breeds').select('*').orderBy('id');
    console.log('\n🐎 Rasy:');
    breeds.forEach(breed => {
      console.log(`  ${breed.id}: ${breed.name}`);
    });
    
    const colors = await knex('colors').select('*').orderBy('id');
    console.log('\n🎨 Maści:');
    colors.forEach(color => {
      console.log(`  ${color.id}: ${color.name}`);
    });
    
    const countries = await knex('countries').select('*').orderBy('code');
    console.log('\n🌍 Kraje:');
    countries.forEach(country => {
      console.log(`  ${country.code}: ${country.name}`);
    });
    
    const breeders = await knex('breeders').select('*').orderBy('id');
    console.log('\n🏠 Hodowcy:');
    breeders.forEach(breeder => {
      console.log(`  ${breeder.id}: ${breeder.name} (${breeder.country_code})`);
    });
    
    const horses = await knex('horses')
      .select('horses.*', 'breeds.name as breed_name', 'colors.name as color_name')
      .leftJoin('breeds', 'horses.breed_id', 'breeds.id')
      .leftJoin('colors', 'horses.color_id', 'colors.id')
      .orderBy('horses.id');
    
    console.log('\n🐴 Konie:');
    horses.forEach(horse => {
      console.log(`  ${horse.id}: ${horse.name} (${horse.gender}, ${horse.breed_name}, ${horse.color_name})`);
      if (horse.sire_id || horse.dam_id) {
        console.log(`    Rodzice: ojciec=${horse.sire_id || 'brak'}, matka=${horse.dam_id || 'brak'}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Błąd podczas pobierania danych:', error);
  }
}

// Główna funkcja
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  try {
    switch (command) {
      case 'cleanup':
        await cleanupDuplicates();
        break;
        
      case 'constraints':
        await addUniqueConstraints();
        break;
        
      case 'show':
        await showCurrentData();
        break;
        
      case 'all':
        await cleanupDuplicates();
        await addUniqueConstraints();
        await showCurrentData();
        break;
        
      default:
        console.log('🔧 Dostępne komendy:');
        console.log('  node cleanup.js cleanup     - usuń duplikaty');
        console.log('  node cleanup.js constraints - dodaj ograniczenia unikalności');
        console.log('  node cleanup.js show        - pokaż aktualne dane');
        console.log('  node cleanup.js all         - wykonaj wszystko');
        process.exit(0);
    }
    
  } catch (error) {
    console.error('💥 Krytyczny błąd:', error);
    process.exit(1);
  } finally {
    await knex.destroy();
    console.log('🔌 Połączenie z bazą danych zostało zamknięte');
  }
}

// Uruchom script
if (require.main === module) {
  main();
}

module.exports = {
  cleanupDuplicates,
  addUniqueConstraints,
  showCurrentData
};