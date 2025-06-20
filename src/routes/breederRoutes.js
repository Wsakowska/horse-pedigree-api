const express = require('express');
const router = express.Router();
const breederController = require('../controllers/breederController');

router.get('/', breederController.getAllBreeders);
router.post('/', breederController.createBreeder);
router.put('/:id', breederController.updateBreeder);
router.delete('/:id', breederController.deleteBreeder);

module.exports = router;
