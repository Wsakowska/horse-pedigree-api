const knex = require('../config/db');

const breedRules = {
  'oo+oo': 'oo',
  'oo+xo': 'xo',
  'oo+xx': 'xxoo',
  'xx+xx': 'xx',
  'xx+xo': 'xo',
  'xx+xxoo': 'xxoo',
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
  if (!horse) return '<html><body><p>Horse not found</p></body></html>';

  const renderNode = (node, currentDepth) => {
    if (!node) return '';
    let html = `<div class="node">${node.name} (${node.gender}, ${node.breed})</div>`;
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
          .node { border: 1px solid #333; padding: 10px; margin: 5px; display: inline-block; }
          .branch { display: flex; justify-content: center; }
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
