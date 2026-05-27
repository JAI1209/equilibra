const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markNotificationRead,
} = require('../controllers/notificationController');
const verifyToken = require('../middleware/authMiddleware');

router.get('/', verifyToken, getNotifications);
router.patch('/:id/read', verifyToken, markNotificationRead);

module.exports = router;
