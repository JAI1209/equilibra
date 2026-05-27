const express = require('express');
const router = express.Router();
const {
  createTeamMission,
  joinTeamMission,
  listTeamMissions,
} = require('../controllers/teamMissionController');
const verifyToken = require('../middleware/authMiddleware');

router.get('/', verifyToken, listTeamMissions);
router.post('/', verifyToken, createTeamMission);
router.post('/:id/join', verifyToken, joinTeamMission);

module.exports = router;
