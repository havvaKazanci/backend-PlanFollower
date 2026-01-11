const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// "POST /api/auth/register" calling register function which is in the controller
router.post('/register', authController.register);
router.post('/login', authController.login);

module.exports = router;