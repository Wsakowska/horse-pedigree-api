const knex = require('../config/db');
const Joi = require('joi');

const countrySchema = Joi.object({
  code: Joi.string().length(2).required(),
  name: Joi.string().max(100).required(),
});

exports.getAllCountries = async (req, res) => {
  try {
    const countries = await knex('countries').select('*');
    res.json(countries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createCountry = async (req, res) => {
  const { error } = countrySchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const [country] = await knex('countries').insert(req.body).returning('*');
    res.status(201).json(country);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateCountry = async (req, res) => {
  const { error } = countrySchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const [country] = await knex('countries')
      .where({ code: req.params.code })
      .update(req.body)
      .returning('*');
    if (!country) return res.status(404).json({ error: 'Country not found' });
    res.json(country);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteCountry = async (req, res) => {
  try {
    const deleted = await knex('countries').where({ code: req.params.code }).del();
    if (!deleted) return res.status(404).json({ error: 'Country not found' });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
