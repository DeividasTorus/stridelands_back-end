const express = require('express');
const router = express.Router();
const buildingsController = require('../controllers/buildingsController');

// ✅ Place this FIRST
router.get('/types', buildingsController.getAllBuildingTypes);

// ✅ Then handle dynamic userId safely
router.get('/:userId', buildingsController.getUserBuildings);
router.post('/build', buildingsController.buildBuilding);
router.post('/upgrade', buildingsController.upgradeBuilding);

module.exports = router;


