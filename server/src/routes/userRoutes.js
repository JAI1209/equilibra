const express = require('express');
const router = express.Router();
const { getProfile, updateProfile } = require('../controllers/userController');
const verifyToken = require('../middleware/authMiddleware');
router.patch('/profile', verifyToken, updateProfile);
router.get('/profile', verifyToken, getProfile);

module.exports = router;
