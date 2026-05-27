const express = require('express');
const router = express.Router();
const { getMissions, createMission, completeMission } = require('../controllers/missionController');
const verifyToken = require('../middleware/authMiddleware');

router.get('/', verifyToken, getMissions);
router.post('/', verifyToken, createMission);
router.post('/complete', verifyToken, completeMission);

module.exports = router;
