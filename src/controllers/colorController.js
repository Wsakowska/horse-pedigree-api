const knex = require('../config/db');
const Joi = require('joi');

const colorSchema = Joi.object({
  name: Joi.string().max(50).required(),
});

// GET - Pobiera wszystkie kolory z tabeli colors.
exports.getAllColors = async (req, res) => {
  try {
    const colors = await knex('colors').select('*');
    res.json(colors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST - Tworzy nowy kolor w bazie danych.
exports.createColor = async (req, res) => {
  const { error } = colorSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const [color] = await knex('colors').insert(req.body).returning('*');
    res.status(201).json(color);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PUT - Aktualizuje istniejący kolor w bazie danych na podstawie id.
exports.updateColor = async (req, res) => {
  const { error } = colorSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const [color] = await knex('colors')
      .where({ id: req.params.id })
      .update(req.body)
      .returning('*');
    if (!color) return res.status(404).json({ error: 'Color not found' });
    res.json(color);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE - Usuwa kolor z bazy danych na podstawie id.
exports.deleteColor = async (req, res) => {
  try {
    const deleted = await knex('colors').where({ id: req.params.id }).del();
    if (!deleted) return res.status(404).json({ error: 'Color not found' });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
