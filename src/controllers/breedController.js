const knex = require('../config/db');
const Joi = require('joi');

const breedSchema = Joi.object({
  name: Joi.string().valid('oo', 'xx', 'xo', 'xxoo').required(),
});

//GET - Pobiera wszystkie rasy z tabeli breeds.
exports.getAllBreeds = async (req, res) => {
  try {
    const breeds = await knex('breeds').select('*');
    res.json(breeds);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//POST - Cel: Tworzy nową rasę w bazie danych.
exports.createBreed = async (req, res) => {
  const { error } = breedSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const [breed] = await knex('breeds').insert(req.body).returning('*');
    res.status(201).json(breed);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//PUT - Aktualizuje istniejącą rasę na podstawie id.
exports.updateBreed = async (req, res) => {
  const { error } = breedSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const [breed] = await knex('breeds')
      .where({ id: req.params.id })
      .update(req.body)
      .returning('*');
    if (!breed) return res.status(404).json({ error: 'Breed not found' });
    res.json(breed);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//DELETE - Usuwa rasę z bazy danych na podstawie id.
exports.deleteBreed = async (req, res) => {
  try {
    const deleted = await knex('breeds').where({ id: req.params.id }).del();
    if (!deleted) return res.status(404).json({ error: 'Breed not found' });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
