const breedRules = {
  'oo+oo': 'oo',
  'oo+xo': 'xo',
  'oo+xx': 'xxoo',
  'xx+xx': 'xx',
  'xx+xo': 'xo',
  'xx+xxoo': 'xxoo',
  'oo+xxoo': 'xxoo',
  // Dodaj symetryczne reguły
  'xo+oo': 'xo',
  'xx+oo': 'xxoo',
  'xo+xx': 'xo',
  'xxoo+xx': 'xxoo',
  'xxoo+oo': 'xxoo',
};

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

    if (!sire || !dam) return null;

    const key = `${sire.name}+${dam.name}`;
    const result = breedRules[key];
    
    console.log(`Obliczanie rasy: ${sire.name} + ${dam.name} = ${result || 'xo (domyślna)'}`);
    
    return result || 'xo'; // domyślna rasa jeśli nie ma reguły
  } catch (error) {
    console.error('Błąd podczas obliczania rasy:', error);
    return 'xo'; // domyślna rasa w przypadku błędu
  }
};

exports.getPedigree = async (knex, horseId, depth) => {
  if (depth < 0) return null;

  try {
    const horse = await knex('horses')
      .where({ id: horseId })
      .select('id', 'name', 'gender', 'breed_id', 'sire_id', 'dam_id')
      .first();

    if (!horse) return null;

    // Pobierz nazwę rasy
    const breed = await knex('breeds').where({ id: horse.breed_id }).select('name').first();
    horse.breed = breed ? breed.name : null;

    if (depth === 0) return horse;

    // Rekurencyjnie pobierz rodziców
    if (horse.sire_id) {
      horse.sire = await exports.getPedigree(knex, horse.sire_id, depth - 1);
    } else {
      horse.sire = null;
    }

    if (horse.dam_id) {
      horse.dam = await exports.getPedigree(knex, horse.dam_id, depth - 1);
    } else {
      horse.dam = null;
    }

    return horse;
  } catch (error) {
    console.error('Błąd podczas pobierania rodowodu:', error);
    return null;
  }
};

exports.getOffspring = async (knex, horseId, filters = {}) => {
  const { gender, breeder_id } = filters;

  try {
    let query = knex('horses')
      .where(function() {
        this.where({ sire_id: horseId }).orWhere({ dam_id: horseId });
      });

    // Poprawione filtrowanie
    if (gender) {
      query = query.andWhere({ gender });
    }
    
    if (breeder_id) {
      query = query.andWhere({ breeder_id: parseInt(breeder_id) });
    }

    const result = await query.select('id', 'name', 'gender', 'breed_id', 'birth_date', 'color_id', 'breeder_id');
    
    console.log(`Znaleziono ${result.length} potomków dla konia ${horseId}`);
    if (gender) console.log(`Filtr płci: ${gender}`);
    if (breeder_id) console.log(`Filtr hodowcy: ${breeder_id}`);
    
    return result;
  } catch (error) {
    console.error('Błąd podczas pobierania potomstwa:', error);
    return [];
  }
};

exports.generatePedigreeHtml = async (knex, horseId, depth) => {
  try {
    const horse = await exports.getPedigree(knex, horseId, depth);
    if (!horse) {
      return `
        <html>
          <head>
            <title>Błąd - Rodowód</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .error { color: red; }
            </style>
          </head>
          <body>
            <div class="error">
              <h2>Błąd</h2>
              <p>Koń o ID ${horseId} nie został znaleziony</p>
            </div>
          </body>
        </html>
      `;
    }

    const renderNode = (node, currentDepth) => {
      if (!node) {
        return '<div class="node empty">Brak danych</div>';
      }
      
      let html = `<div class="node" data-horse-id="${node.id}">
        <div class="horse-name">${node.name}</div>
        <div class="horse-details">${node.gender}, ${node.breed || 'brak rasy'}</div>
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

    return `
      <!DOCTYPE html>
      <html lang="pl">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Rodowód - ${horse.name}</title>
          <style>
            body {
              font-family: 'Segoe UI', Arial, sans-serif;
              background-color: #f5f5f5;
              margin: 0;
              padding: 20px;
            }
            .tree {
              text-align: center;
              max-width: 1200px;
              margin: 0 auto;
            }
            .node {
              border: 2px solid #34495e;
              background-color: white;
              padding: 15px;
              margin: 10px;
              display: inline-block;
              border-radius: 8px;
              cursor: pointer;
              transition: all 0.3s ease;
              min-width: 150px;
              box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
            .node:hover {
              background-color: #3498db;
              color: white;
              transform: translateY(-2px);
              box-shadow: 0 4px 10px rgba(0,0,0,0.2);
            }
            .node.empty {
              background-color: #ecf0f1;
              border-style: dashed;
              color: #7f8c8d;
            }
            .horse-name {
              font-weight: bold;
              font-size: 1.1em;
              margin-bottom: 5px;
            }
            .horse-details {
              font-size: 0.9em;
              opacity: 0.8;
            }
            .branch {
              display: flex;
              justify-content: center;
              gap: 30px;
              position: relative;
              margin-top: 20px;
            }
            .branch::before {
              content: '';
              position: absolute;
              top: -20px;
              left: 50%;
              width: 2px;
              height: 20px;
              background-color: #34495e;
              transform: translateX(-50%);
            }
            .parent {
              flex: 1;
              max-width: 300px;
            }
            .parent-label {
              font-size: 0.8em;
              color: #7f8c8d;
              margin-bottom: 5px;
              font-weight: bold;
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
              margin-bottom: 30px;
            }
            .info {
              text-align: center;
              color: #7f8c8d;
              margin-bottom: 20px;
            }
            @media (max-width: 768px) {
              .branch {
                flex-direction: column;
                gap: 10px;
              }
              .node {
                min-width: 120px;
                padding: 10px;
              }
            }
          </style>
        </head>
        <body>
          <h1>Rodowód konia ${horse.name}</h1>
          <div class="info">Głębokość: ${depth} ${depth === 1 ? 'generacja' : 'generacje'}</div>
          <div class="tree">
            ${renderNode(horse, depth)}
          </div>
          <script>
            document.querySelectorAll('.node[data-horse-id]').forEach(node => {
              node.addEventListener('click', () => {
                const horseId = node.dataset.horseId;
                alert('ID konia: ' + horseId + '\\nKliknij OK aby kontynuować');
                // Tutaj można dodać przekierowanie do szczegółów konia
              });
            });
          </script>
        </body>
      </html>
    `;
  } catch (error) {
    console.error('Błąd podczas generowania HTML rodowodu:', error);
    return `
      <html>
        <head><title>Błąd</title></head>
        <body>
          <h2>Błąd podczas generowania rodowodu</h2>
          <p>Przepraszamy, wystąpił błąd podczas generowania rodowodu.</p>
        </body>
      </html>
    `;
  }
};