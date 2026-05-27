const express = require('express');
const router = express.Router();
const { getRankings } = require('../controllers/rankingController');

router.get('/', getRankings);

module.exports = router;
