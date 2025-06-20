// Kompletne reguły ras - wszystkie możliwe kombinacje
const breedRules = {
  // Podstawowe kombinacje z wymagań
  'oo+oo': 'oo',
  'oo+xo': 'xo',
  'oo+xx': 'xxoo',
  'xx+xx': 'xx',
  'xx+xo': 'xo',
  'xx+xxoo': 'xxoo',
  'oo+xxoo': 'xxoo',
  
  // Symetryczne kombinacje
  'xo+oo': 'xo',
  'xx+oo': 'xxoo',
  'xo+xx': 'xo',
  'xxoo+xx': 'xxoo',
  'xxoo+oo': 'xxoo',
  
  // Dodatkowe kombinacje (logiczne uzupełnienia)
  'xo+xo': 'xo',
  'xxoo+xo': 'xxoo',
  'xo+xxoo': 'xxoo',
  'xxoo+xxoo': 'xxoo'
};

// Funkcja sprawdzająca cykliczne relacje rodzinne
exports.checkCyclicRelations = async (knex, horseId, sireId, damId) => {
  if (!sireId && !damId) return false;
  
  const checkAncestor = async (currentId, targetId, visited = new Set()) => {
    if (!currentId || currentId === targetId) return currentId === targetId;
    if (visited.has(currentId)) return false; // Zapobieganie nieskończonym pętlom
    
    visited.add(currentId);
    
    try {
      const horse = await knex('horses')
        .where({ id: currentId })
        .select('sire_id', 'dam_id')
        .first();
      
      if (!horse) return false;
      
      // Sprawdź czy target jest przodkiem current
      if (horse.sire_id && await checkAncestor(horse.sire_id, targetId, new Set(visited))) {
        return true;
      }
      if (horse.dam_id && await checkAncestor(horse.dam_id, targetId, new Set(visited))) {
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Błąd podczas sprawdzania przodków:', error);
      return false;
    }
  };
  
  // Sprawdź czy koń nie jest swoim własnym przodkiem przez ojca
  if (sireId) {
    if (sireId == horseId) return true; // Bezpośredni przypadek
    if (await checkAncestor(sireId, parseInt(horseId))) return true;
  }
  
  // Sprawdź czy koń nie jest swoim własnym przodkiem przez matkę
  if (damId) {
    if (damId == horseId) return true; // Bezpośredni przypadek
    if (await checkAncestor(damId, parseInt(horseId))) return true;
  }
  
  return false;
};

// Ulepszona funkcja obliczania rasy
exports.calculateBreed = async (knex, sireId, damId) => {
  if (!sireId || !damId) return null;

  try {
    const sire = await knex('horses')
      .join('breeds', 'horses.breed_id', 'breeds.id')
      .where('horses.id', sireId)
      .select('breeds.name')
      .first();

    const dam = await knex('horses')
      .join('breeds', 'horses.breed_id', 'breeds.id')
      .where('horses.id', damId)
      .select('breeds.name')
      .first();

    if (!sire || !dam) {
      console.warn(`Nie znaleziono rasy dla rodziców: sire_id=${sireId}, dam_id=${damId}`);
      return null;
    }

    const key = `${sire.name}+${dam.name}`;
    const result = breedRules[key];
    
    if (!result) {
      console.warn(`Brak reguły dla kombinacji: ${key}, używam domyślnej rasy 'xo'`);
      return 'xo';
    }
    
    console.log(`Obliczanie rasy: ${sire.name} + ${dam.name} = ${result}`);
    return result;
  } catch (error) {
    console.error('Błąd podczas obliczania rasy:', error);
    return 'xo'; // domyślna rasa w przypadku błędu
  }
};

// Funkcja pobierania rodowodu z zabezpieczeniem przed cyklicznymi relacjami
exports.getPedigree = async (knex, horseId, depth, visitedIds = new Set()) => {
  if (depth < 0) return null;
  if (visitedIds.has(horseId)) {
    console.warn(`Wykryto cykliczną relację dla konia ID: ${horseId}`);
    return null;
  }

  try {
    const horse = await knex('horses')
      .where({ id: horseId })
      .select('id', 'name', 'gender', 'breed_id', 'sire_id', 'dam_id', 'birth_date')
      .first();

    if (!horse) return null;

    // Pobierz nazwę rasy
    const breed = await knex('breeds').where({ id: horse.breed_id }).select('name').first();
    horse.breed = breed ? breed.name : null;

    if (depth === 0) return horse;

    // Dodaj aktualny koń do odwiedzonych
    const newVisitedIds = new Set(visitedIds);
    newVisitedIds.add(horseId);

    // Rekurencyjnie pobierz rodziców
    if (horse.sire_id) {
      horse.sire = await exports.getPedigree(knex, horse.sire_id, depth - 1, newVisitedIds);
    } else {
      horse.sire = null;
    }

    if (horse.dam_id) {
      horse.dam = await exports.getPedigree(knex, horse.dam_id, depth - 1, newVisitedIds);
    } else {
      horse.dam = null;
    }

    return horse;
  } catch (error) {
    console.error('Błąd podczas pobierania rodowodu:', error);
    return null;
  }
};

// Funkcja pobierania potomstwa z lepszą obsługą filtrów
exports.getOffspring = async (knex, horseId, filters = {}) => {
  const { gender, breeder_id, limit = 100, offset = 0 } = filters;

  try {
    let query = knex('horses')
      .where(function() {
        this.where({ sire_id: horseId }).orWhere({ dam_id: horseId });
      });

    // Aplikuj filtry
    if (gender && ['klacz', 'ogier', 'wałach'].includes(gender)) {
      query = query.andWhere({ gender });
    }
    
    if (breeder_id && !isNaN(breeder_id)) {
      query = query.andWhere({ breeder_id: parseInt(breeder_id) });
    }

    // Dodaj paginację
    query = query.limit(limit).offset(offset);

    const result = await query.select(
      'id', 'name', 'gender', 'breed_id', 'birth_date', 
      'color_id', 'breeder_id', 'sire_id', 'dam_id'
    ).orderBy('birth_date', 'desc');
    
    console.log(`Znaleziono ${result.length} potomków dla konia ${horseId}`);
    if (gender) console.log(`Filtr płci: ${gender}`);
    if (breeder_id) console.log(`Filtr hodowcy: ${breeder_id}`);
    
    return result;
  } catch (error) {
    console.error('Błąd podczas pobierania potomstwa:', error);
    return [];
  }
};

// Ulepszona funkcja generowania HTML z lepszą obsługą błędów
exports.generatePedigreeHtml = async (knex, horseId, depth) => {
  try {
    const horse = await exports.getPedigree(knex, horseId, depth);
    if (!horse) {
      return generateErrorHtml(`Koń o ID ${horseId} nie został znaleziony lub wystąpił cykl w rodowodzie`);
    }

    const renderNode = (node, currentDepth) => {
      if (!node) {
        return '<div class="node empty">Brak danych</div>';
      }
      
      const birthYear = node.birth_date ? new Date(node.birth_date).getFullYear() : '';
      const birthInfo = birthYear ? ` (ur. ${birthYear})` : '';
      
      let html = `<div class="node" data-horse-id="${node.id}">
        <div class="horse-name">${escapeHtml(node.name)}</div>
        <div class="horse-details">${node.gender}, ${node.breed || 'brak rasy'}${birthInfo}</div>
      </div>`;
      
      if (currentDepth > 0 && (node.sire || node.dam)) {
        html += '<div class="branch">';
        html += '<div class="parent sire">';
        html += '<div class="parent-label">Ojciec</div>';
        html += renderNode(node.sire, currentDepth - 1);
        html += '</div>';
        html += '<div class="parent dam">';
        html += '<div class="parent-label">Matka</div>';
        html += renderNode(node.dam, currentDepth - 1);
        html += '</div>';
        html += '</div>';
      }
      return html;
    };

    return generatePedigreeHtml(horse, depth, renderNode);
  } catch (error) {
    console.error('Błąd podczas generowania HTML rodowodu:', error);
    return generateErrorHtml('Wystąpił błąd podczas generowania rodowodu');
  }
};

// Funkcja pomocnicza do escapowania HTML
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Funkcja generująca HTML błędu
function generateErrorHtml(errorMessage) {
  return `
    <!DOCTYPE html>
    <html lang="pl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Błąd - Rodowód</title>
        <style>
          body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            text-align: center; 
            padding: 50px; 
            background-color: #f8f9fa;
          }
          .error { 
            color: #dc3545; 
            background-color: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            max-width: 500px;
            margin: 0 auto;
          }
          .error h2 { margin-bottom: 20px; }
          .error p { font-size: 1.1em; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="error">
          <h2>⚠️ Błąd</h2>
          <p>${escapeHtml(errorMessage)}</p>
        </div>
      </body>
    </html>
  `;
}

// Funkcja generująca główny HTML rodowodu
function generatePedigreeHtml(horse, depth, renderNode) {
  return `
    <!DOCTYPE html>
    <html lang="pl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Rodowód - ${escapeHtml(horse.name)}</title>
        <style>
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 20px;
            min-height: 100vh;
          }
          .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          }
          .tree {
            text-align: center;
          }
          .node {
            border: 2px solid #34495e;
            background: linear-gradient(145deg, #ffffff, #f8f9fa);
            padding: 20px;
            margin: 15px;
            display: inline-block;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s ease;
            min-width: 180px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            position: relative;
          }
          .node:hover {
            background: linear-gradient(145deg, #3498db, #2980b9);
            color: white;
            transform: translateY(-5px) scale(1.02);
            box-shadow: 0 8px 25px rgba(52, 152, 219, 0.3);
          }
          .node.empty {
            background: #ecf0f1;
            border-style: dashed;
            color: #7f8c8d;
            opacity: 0.7;
          }
          .horse-name {
            font-weight: bold;
            font-size: 1.2em;
            margin-bottom: 8px;
            color: #2c3e50;
          }
          .node:hover .horse-name {
            color: white;
          }
          .horse-details {
            font-size: 0.95em;
            opacity: 0.8;
            color: #34495e;
          }
          .node:hover .horse-details {
            opacity: 1;
            color: white;
          }
          .branch {
            display: flex;
            justify-content: center;
            gap: 40px;
            position: relative;
            margin-top: 30px;
          }
          .branch::before {
            content: '';
            position: absolute;
            top: -30px;
            left: 50%;
            width: 3px;
            height: 30px;
            background: linear-gradient(180deg, #34495e, #2c3e50);
            transform: translateX(-50%);
            border-radius: 2px;
          }
          .parent {
            flex: 1;
            max-width: 350px;
          }
          .parent-label {
            font-size: 0.9em;
            color: #7f8c8d;
            margin-bottom: 10px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .sire .parent-label {
            color: #3498db;
          }
          .dam .parent-label {
            color: #e74c3c;
          }
          h1 {
            color: #2c3e50;
            text-align: center;
            margin-bottom: 10px;
            font-size: 2.5em;
            font-weight: 300;
          }
          .info {
            text-align: center;
            color: #7f8c8d;
            margin-bottom: 30px;
            font-size: 1.1em;
          }
          @media (max-width: 768px) {
            .container { margin: 10px; padding: 20px; }
            .branch { flex-direction: column; gap: 20px; }
            .node { min-width: 140px; padding: 15px; }
            h1 { font-size: 2em; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🐎 Rodowód konia ${escapeHtml(horse.name)}</h1>
          <div class="info">Głębokość: ${depth} ${depth === 1 ? 'generacja' : 'generacje'}</div>
          <div class="tree">
            ${renderNode(horse, depth)}
          </div>
          <div style="text-align: center; margin-top: 30px; color: #7f8c8d; font-size: 0.9em;">
            Kliknij na koń aby zobaczyć jego ID
          </div>
        </div>
        <script>
          document.querySelectorAll('.node[data-horse-id]').forEach(node => {
            node.addEventListener('click', () => {
              const horseId = node.dataset.horseId;
              const horseName = node.querySelector('.horse-name').textContent;
              alert('🐴 ' + horseName + '\\nID: ' + horseId + '\\n\\nKliknij OK aby kontynuować');
            });
          });
        </script>
      </body>
    </html>
  `;
}