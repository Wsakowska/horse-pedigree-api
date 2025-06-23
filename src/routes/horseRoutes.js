const express = require('express');
const router = express.Router();
const horseController = require('../controllers/horseController');

// Endpoint breeding/check MUSI być przed /:id
router.get('/breeding/check', horseController.checkBreeding);

// Podstawowe operacje CRUD
router.get('/', horseController.getAllHorses);
router.get('/:id', horseController.getHorseById);
router.post('/', horseController.createHorse);
router.put('/:id', horseController.updateHorse);
router.delete('/:id', horseController.deleteHorse);

// Operacje związane z rodowodami
router.get('/:id/pedigree/:depth', horseController.getPedigree);
router.get('/:id/pedigree/html/:depth', horseController.getPedigreeHtml);

// Operacje związane z potomstwem
router.get('/:id/offspring', horseController.getOffspring);

module.exports = router;