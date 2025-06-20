const knex = require('../config/db');
const Joi = require('joi');
const { calculateBreed, getPedigree, getOffspring, generatePedigreeHtml } = require('../services/pedigreeService');

const horseSchema = Joi.object({
  name: Joi.string().max(100).required(),
  breed_id: Joi.number().integer().required(),
  birth_date: Joi.date().optional(),
  gender: Joi.string().valid('klacz', 'ogier', 'wałach').required(),
  sire_id: Joi.number().integer().optional(),
  dam_id: Joi.number().integer().optional(),
  color_id: Joi.number().integer().required(),
  breeder_id: Joi.number().integer().required(),
});

exports.getAllHorses = async (req, res) => {
  try {
    const horses = await knex('horses').select('*');
    res.json(horses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createHorse = async (req, res) => {
  const { error } = horseSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { sire_id, dam_id, breed_id, breeder_id, color_id } = req.body;

  // Sprawdź czy hodowca istnieje
  const breederExists = await knex('breeders').where({ id: breeder_id }).first();
  if (!breederExists) {
    return res.status(400).json({ error: 'Breeder must be a valid breeder ID' });
  }

  // Sprawdź czy maść istnieje
  const colorExists = await knex('colors').where({ id: color_id }).first();
  if (!colorExists) {
    return res.status(400).json({ error: 'Color must be a valid color ID' });
  }

  // Sprawdź czy rasa istnieje
  const breedExists = await knex('breeds').where({ id: breed_id }).first();
  if (!breedExists) {
    return res.status(400).json({ error: 'Breed must be a valid breed ID' });
  }

  // Validate parents' gender
  if (sire_id) {
    const sire = await knex('horses').where({ id: sire_id }).first();
    if (!sire) {
      return res.status(400).json({ error: 'Sire must be a valid horse ID' });
    }
    if (sire.gender !== 'ogier') {
      return res.status(400).json({ error: 'Sire must be an ogier' });
    }
  }
  if (dam_id) {
    const dam = await knex('horses').where({ id: dam_id }).first();
    if (!dam) {
      return res.status(400).json({ error: 'Dam must be a valid horse ID' });
    }
    if (dam.gender !== 'klacz') {
      return res.status(400).json({ error: 'Dam must be a klacz' });
    }
  }

  // Calculate breed if parents are provided
  let finalBreedId = breed_id;
  if (sire_id && dam_id) {
    const calculatedBreed = await calculateBreed(knex, sire_id, dam_id);
    const breed = await knex('breeds').where({ name: calculatedBreed }).first();
    if (breed) finalBreedId = breed.id;
  }

  try {
    const [horse] = await knex('horses')
      .insert({ ...req.body, breed_id: finalBreedId })
      .returning('*');
    res.status(201).json(horse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateHorse = async (req, res) => {
  const { error } = horseSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { sire_id, dam_id, breeder_id, color_id, breed_id } = req.body;

  // Sprawdź czy hodowca istnieje
  const breederExists = await knex('breeders').where({ id: breeder_id }).first();
  if (!breederExists) {
    return res.status(400).json({ error: 'Breeder must be a valid breeder ID' });
  }

  // Sprawdź czy maść istnieje
  const colorExists = await knex('colors').where({ id: color_id }).first();
  if (!colorExists) {
    return res.status(400).json({ error: 'Color must be a valid color ID' });
  }

  // Sprawdź czy rasa istnieje
  const breedExists = await knex('breeds').where({ id: breed_id }).first();
  if (!breedExists) {
    return res.status(400).json({ error: 'Breed must be a valid breed ID' });
  }

  // Validate parents' gender
  if (sire_id) {
    const sire = await knex('horses').where({ id: sire_id }).first();
    if (!sire) {
      return res.status(400).json({ error: 'Sire must be a valid horse ID' });
    }
    if (sire.gender !== 'ogier') {
      return res.status(400).json({ error: 'Sire must be an ogier' });
    }
  }
  if (dam_id) {
    const dam = await knex('horses').where({ id: dam_id }).first();
    if (!dam) {
      return res.status(400).json({ error: 'Dam must be a valid horse ID' });
    }
    if (dam.gender !== 'klacz') {
      return res.status(400).json({ error: 'Dam must be a klacz' });
    }
  }

  try {
    const [horse] = await knex('horses')
      .where({ id: req.params.id })
      .update(req.body)
      .returning('*');
    if (!horse) return res.status(404).json({ error: 'Horse not found' });
    res.json(horse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteHorse = async (req, res) => {
  try {
    const deleted = await knex('horses').where({ id: req.params.id }).del();
    if (!deleted) return res.status(404).json({ error: 'Horse not found' });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPedigree = async (req, res) => {
  const { id, depth } = req.params;
  if (!id || isNaN(id) || !depth || isNaN(depth)) {
    return res.status(400).json({ error: 'Invalid horse ID or depth' });
  }
  try {
    const pedigree = await getPedigree(knex, id, parseInt(depth));
    if (!pedigree) return res.status(404).json({ error: 'Horse not found' });
    res.json(pedigree);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getOffspring = async (req, res) => {
  const { id } = req.params;
  const { gender, breeder_id } = req.query;
  if (!id || isNaN(id)) {
    return res.status(400).json({ error: 'Invalid horse ID' });
  }
  try {
    const offspring = await getOffspring(knex, id, { gender, breeder_id });
    res.json(offspring);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPedigreeHtml = async (req, res) => {
  const { id, depth } = req.params;
  try {
    const html = await generatePedigreeHtml(knex, id, parseInt(depth));
    res.set('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};