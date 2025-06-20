const express = require('express');
const router = express.Router();
const horseController = require('../controllers/horseController');

router.get('/', horseController.getAllHorses);
router.post('/', horseController.createHorse);
router.put('/:id', horseController.updateHorse);
router.delete('/:id', horseController.deleteHorse);
router.get('/:id/pedigree/:depth', horseController.getPedigree);
router.get('/:id/offspring', horseController.getOffspring);
router.get('/:id/pedigree/html/:depth', horseController.getPedigreeHtml);

module.exports = router;
