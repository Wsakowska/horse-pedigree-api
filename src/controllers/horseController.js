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

const handleDatabaseError = (error, res) => {
  console.error('Database error:', error);
  
  if (error.code === '23505') { // unique violation
    return res.status(409).json({ error: 'Rekord o tych danych już istnieje' });
  }
  
  if (error.code === '23503') { // foreign key violation
    return res.status(400).json({ error: 'Nie można usunąć - rekord jest używany w innych tabelach' });
  }
  
  if (error.code === '23514') { // check constraint violation
    return res.status(400).json({ error: 'Dane nie spełniają warunków walidacji bazodanowych' });
  }
  
  return res.status(500).json({ error: 'Błąd serwera bazy danych' });
};

exports.getAllHorses = async (req, res) => {
  try {
    const horses = await knex('horses').select('*');
    res.json(horses);
  } catch (error) {
    handleDatabaseError(error, res);
  }
};

exports.createHorse = async (req, res) => {
  const { error } = horseSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { sire_id, dam_id, breed_id } = req.body;

  try {
    // Sprawdź czy rodzice istnieją i mają odpowiednią płeć
    if (sire_id) {
      const sire = await knex('horses').where({ id: sire_id }).first();
      if (!sire) {
        return res.status(400).json({ error: 'Ojciec o podanym ID nie istnieje' });
      }
      if (sire.gender !== 'ogier') {
        return res.status(400).json({ error: 'Ojciec musi być ogierem' });
      }
    }
    
    if (dam_id) {
      const dam = await knex('horses').where({ id: dam_id }).first();
      if (!dam) {
        return res.status(400).json({ error: 'Matka o podanym ID nie istnieje' });
      }
      if (dam.gender !== 'klacz') {
        return res.status(400).json({ error: 'Matka musi być klaczą' });
      }
    }

    // Sprawdź czy ojciec i matka to nie ten sam koń
    if (sire_id && dam_id && sire_id === dam_id) {
      return res.status(400).json({ error: 'Ojciec i matka nie mogą być tym samym koniem' });
    }

    // Oblicz rasę jeśli są rodzice
    let finalBreedId = breed_id;
    if (sire_id && dam_id) {
      const calculatedBreed = await calculateBreed(knex, sire_id, dam_id);
      const breed = await knex('breeds').where({ name: calculatedBreed }).first();
      if (breed) {
        finalBreedId = breed.id;
        console.log(`Automatycznie obliczona rasa: ${calculatedBreed} (ID: ${breed.id})`);
      }
    }

    const [horse] = await knex('horses')
      .insert({ ...req.body, breed_id: finalBreedId })
      .returning('*');
    
    res.status(201).json(horse);
  } catch (error) {
    handleDatabaseError(error, res);
  }
};

exports.updateHorse = async (req, res) => {
  const { error } = horseSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { sire_id, dam_id } = req.body;
  const horseId = req.params.id;

  try {
    // Sprawdź czy koń istnieje
    const existingHorse = await knex('horses').where({ id: horseId }).first();
    if (!existingHorse) {
      return res.status(404).json({ error: 'Koń nie znaleziony' });
    }

    // Sprawdź czy rodzice istnieją i mają odpowiednią płeć
    if (sire_id) {
      if (sire_id == horseId) {
        return res.status(400).json({ error: 'Koń nie może być swoim własnym ojcem' });
      }
      const sire = await knex('horses').where({ id: sire_id }).first();
      if (!sire) {
        return res.status(400).json({ error: 'Ojciec o podanym ID nie istnieje' });
      }
      if (sire.gender !== 'ogier') {
        return res.status(400).json({ error: 'Ojciec musi być ogierem' });
      }
    }
    
    if (dam_id) {
      if (dam_id == horseId) {
        return res.status(400).json({ error: 'Koń nie może być swoją własną matką' });
      }
      const dam = await knex('horses').where({ id: dam_id }).first();
      if (!dam) {
        return res.status(400).json({ error: 'Matka o podanym ID nie istnieje' });
      }
      if (dam.gender !== 'klacz') {
        return res.status(400).json({ error: 'Matka musi być klaczą' });
      }
    }

    // Sprawdź czy ojciec i matka to nie ten sam koń
    if (sire_id && dam_id && sire_id === dam_id) {
      return res.status(400).json({ error: 'Ojciec i matka nie mogą być tym samym koniem' });
    }

    const [horse] = await knex('horses')
      .where({ id: horseId })
      .update(req.body)
      .returning('*');
    
    if (!horse) return res.status(404).json({ error: 'Koń nie znaleziony' });
    res.json(horse);
  } catch (error) {
    handleDatabaseError(error, res);
  }
};

exports.deleteHorse = async (req, res) => {
  try {
    const deleted = await knex('horses').where({ id: req.params.id }).del();
    if (!deleted) return res.status(404).json({ error: 'Koń nie znaleziony' });
    res.status(204).send();
  } catch (error) {
    handleDatabaseError(error, res);
  }
};

exports.getPedigree = async (req, res) => {
  const { id, depth } = req.params;
  
  if (!id || isNaN(id) || !depth || isNaN(depth)) {
    return res.status(400).json({ error: 'Nieprawidłowe ID konia lub głębokość' });
  }
  
  const depthNum = parseInt(depth);
  if (depthNum < 0 || depthNum > 10) {
    return res.status(400).json({ error: 'Głębokość musi być między 0 a 10' });
  }
  
  try {
    const pedigree = await getPedigree(knex, parseInt(id), depthNum);
    if (!pedigree) return res.status(404).json({ error: 'Koń nie znaleziony' });
    res.json(pedigree);
  } catch (error) {
    handleDatabaseError(error, res);
  }
};

exports.getOffspring = async (req, res) => {
  const { id } = req.params;
  const { gender, breeder_id } = req.query;
  
  if (!id || isNaN(id)) {
    return res.status(400).json({ error: 'Nieprawidłowe ID konia' });
  }
  
  // Walidacja parametrów filtrowania
  if (gender && !['klacz', 'ogier', 'wałach'].includes(gender)) {
    return res.status(400).json({ error: 'Nieprawidłowa płeć. Dozwolone: klacz, ogier, wałach' });
  }
  
  if (breeder_id && isNaN(breeder_id)) {
    return res.status(400).json({ error: 'Nieprawidłowe ID hodowcy' });
  }
  
  try {
    const offspring = await getOffspring(knex, parseInt(id), { gender, breeder_id });
    res.json(offspring);
  } catch (error) {
    handleDatabaseError(error, res);
  }
};

exports.getPedigreeHtml = async (req, res) => {
  const { id, depth } = req.params;
  
  if (!id || isNaN(id) || !depth || isNaN(depth)) {
    return res.status(400).json({ error: 'Nieprawidłowe ID konia lub głębokość' });
  }
  
  const depthNum = parseInt(depth);
  if (depthNum < 0 || depthNum > 10) {
    return res.status(400).json({ error: 'Głębokość musi być między 0 a 10' });
  }
  
  try {
    const html = await generatePedigreeHtml(knex, parseInt(id), depthNum);
    res.set('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    handleDatabaseError(error, res);
  }
};