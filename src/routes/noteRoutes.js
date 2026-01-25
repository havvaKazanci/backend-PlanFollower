const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');
const authMiddleware = require('../middleware/authMiddleware');

// POST /api/notes - Adding note (before adding you must loged in!)
router.post('/', authMiddleware, noteController.createNote);

// GET /api/notes - Retrieve user-specific notes
router.get('/', authMiddleware, noteController.getUserNotes);


// DELETE /api/notes/:id - Route to delete a note
router.delete('/:id', authMiddleware, noteController.deleteNote);


router.put('/:id', authMiddleware, noteController.updateNote); //update with put request


router.post('/:id/share', authMiddleware, noteController.shareNote);

router.get('/notifications', authMiddleware, noteController.getUnreadNotifications);
router.patch('/notifications/:id/read', authMiddleware, noteController.markAsRead);
router.patch('/notifications/read-all', authMiddleware, noteController.markAllAsRead);

module.exports = router;