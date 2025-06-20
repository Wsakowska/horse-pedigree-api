const knex = require('../config/db');
const Joi = require('joi');

const breederSchema = Joi.object({
  name: Joi.string().max(100).required(),
  country_code: Joi.string().length(2).required(),
});

exports.getAllBreeders = async (req, res) => {
  try {
    const breeders = await knex('breeders').select('*');
    res.json(breeders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createBreeder = async (req, res) => {
  const { error } = breederSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  // Sprawdź czy kraj istnieje
  const countryExists = await knex('countries').where('code', req.body.country_code).first();
  if (!countryExists) {
    return res.status(400).json({ error: 'Country code must be a valid country code' });
  }

  try {
    const [breeder] = await knex('breeders').insert(req.body).returning('*');
    res.status(201).json(breeder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateBreeder = async (req, res) => {
  const { error } = breederSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  // Sprawdź czy kraj istnieje
  const countryExists = await knex('countries').where('code', req.body.country_code).first();
  if (!countryExists) {
    return res.status(400).json({ error: 'Country code must be a valid country code' });
  }

  try {
    const [breeder] = await knex('breeders')
      .where({ id: req.params.id })
      .update(req.body)
      .returning('*');
    if (!breeder) return res.status(404).json({ error: 'Breeder not found' });
    res.json(breeder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteBreeder = async (req, res) => {
  try {
    const deleted = await knex('breeders').where({ id: req.params.id }).del();
    if (!deleted) return res.status(404).json({ error: 'Breeder not found' });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};