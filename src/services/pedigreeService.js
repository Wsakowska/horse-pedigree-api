const knex = require('../config/db');

const breedRules = {
  // Podstawowe reguły z polecenia
  'oo+oo': 'oo',
  'oo+xo': 'xo',
  'oo+xx': 'xxoo',
  'xx+xx': 'xx',
  'xx+xo': 'xo',
  'xx+xxoo': 'xxoo',
  'oo+xxoo': 'xxoo',
  
  // Symetryczne kombinacje (ojciec + matka = matka + ojciec)
  'xo+oo': 'xo',
  'xx+oo': 'xxoo',
  'xo+xx': 'xo',
  'xxoo+xx': 'xxoo',
  'xxoo+oo': 'xxoo',
  
  // Dodatkowe kombinacje
  'xo+xo': 'xo',
  'xo+xxoo': 'xxoo',
  'xxoo+xo': 'xxoo',
  'xxoo+xxoo': 'xxoo',
};

exports.calculateBreed = async (knex, sireId, damId) => {
  if (!sireId || !damId) return null;

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
  return breedRules[key] || 'xo';
};

exports.getPedigree = async (knex, horseId, depth) => {
  if (depth < 0) return null;

  const horse = await knex('horses')
    .where({ id: horseId })
    .select('id', 'name', 'gender', 'breed_id', 'sire_id', 'dam_id')
    .first();

  if (!horse) return null;

  const breed = await knex('breeds').where({ id: horse.breed_id }).select('name').first();
  horse.breed = breed ? breed.name : null;

  if (depth === 0) return horse;

  horse.sire = await exports.getPedigree(knex, horse.sire_id, depth - 1);
  horse.dam = await exports.getPedigree(knex, horse.dam_id, depth - 1);

  return horse;
};

exports.getOffspring = async (knex, horseId, filters = {}) => {
  const { gender, breeder_id } = filters;

  let query = knex('horses').where({ sire_id: horseId }).orWhere({ dam_id: horseId });

  if (gender) query = query.where({ gender });
  if (breeder_id) query = query.where({ breeder_id });

  return query.select('id', 'name', 'gender', 'breed_id', 'birth_date', 'color_id', 'breeder_id');
};

exports.generatePedigreeHtml = async (knex, horseId, depth) => {
  const horse = await exports.getPedigree(knex, horseId, depth);
  if (!horse) return '<html><body><p>Koń nie znaleziony</p></body></html>';

  const renderNode = (node, currentDepth) => {
    if (!node) return '';
    let html = `<div class="node" data-horse-id="${node.id}">${node.name} (${node.gender}, ${node.breed})</div>`;
    if (currentDepth > 0 && (node.sire || node.dam)) {
      html += '<div class="branch">';
      html += renderNode(node.sire, currentDepth - 1);
      html += renderNode(node.dam, currentDepth - 1);
      html += '</div>';
    }
    return html;
  };

  return `
    <html>
      <head>
        <style>
          .tree { font-family: Arial; text-align: center; }
          .node { border: 2px solid #34495e; padding: 10px; margin: 10px; display: inline-block; border-radius: 5px; cursor: pointer; }
          .node:hover { background-color: #1abc9c; color: white; }
          .branch { display: flex; justify-content: center; gap: 20px; position: relative; }
          .branch::before { content: ''; position: absolute; top: -20px; left: 50%; width: 2px; height: 20px; background-color: #34495e; }
        </style>
      </head>
      <body>
        <div class="tree">
          ${renderNode(horse, depth)}
        </div>
      </body>
    </html>
  `;
};