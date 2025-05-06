const express = require('express');
const router = express.Router();
const warriorsController = require('../controllers/warriorsController');

// ✅ Get all global warrior types (e.g. for UI menu)
router.get('/types', warriorsController.getAllWarriorTypes);

// ✅ Get all user warriors
router.get('/:userId', warriorsController.getUserWarriors);

// ✅ Train warrior
router.post('/train', warriorsController.trainWarrior);

// ✅ Upgrade warrior
router.post('/upgrade', warriorsController.upgradeWarrior);

// ✅ Apply warrior upgrades
router.post('/apply-upgrades/:userId', warriorsController.applyWarriorUpgrades);

// ✅ Apply warrior training
router.post('/apply-training/:userId', warriorsController.applyWarriorTraining);

// ✅ ⬇️ Correct path for training-queue
router.get('/training-queue/:userId', warriorsController.getUserWarriorTrainingQueue);

module.exports = router;

