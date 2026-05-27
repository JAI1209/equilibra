const express = require('express');
const router = express.Router();
const { createJournalEntry, getJournalEntries } = require('../controllers/journalController');
const verifyToken = require('../middleware/authMiddleware');

router.get('/', verifyToken, getJournalEntries);
router.post('/', verifyToken, createJournalEntry);

module.exports = router;
