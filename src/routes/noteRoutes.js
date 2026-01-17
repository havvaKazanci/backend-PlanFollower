const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');
const authMiddleware = require('../middleware/authMiddleware');

// POST /api/notes - Adding note (before adding you must loged in!)
router.post('/', authMiddleware, noteController.createNote);

// GET /api/notes - Retrieve user-specific notes
router.get('/', authMiddleware, noteController.getUserNotes);

module.exports = router;