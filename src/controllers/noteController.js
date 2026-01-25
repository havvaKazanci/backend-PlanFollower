const pool = require('../config/db'); //db connection

exports.createNote = async (req, res) => {
    const { title, content } = req.body;
    const userId = req.user.userId; //uuid comes from middleware (for security used middleware)

    try {
        //adding note to the database
        const newNote = await pool.query(
            "INSERT INTO notes (title, content, user_id) VALUES ($1, $2, $3) RETURNING *",
            [title, content, userId]
        );

        res.status(201).json({
            message: "Note created successfully.",
            note: newNote.rows[0]
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error.");
    }
};


// getting all notes for the logged-in user
exports.getUserNotes = async (req, res) => {
    // uuid comes from middleware (for security used middleware)
    const userId = req.user.userId; 

    const { search } = req.query;
    

    try {
        let query = `
            SELECT * FROM notes WHERE user_id = $1 
            UNION 
            SELECT n.* FROM notes n 
            JOIN shared_notes sn ON n.id = sn.note_id 
            WHERE sn.shared_with_user_id = $1
        `;
        let params = [userId];

        //searching both shared and listed notes
        if (search) {
            query = `SELECT * FROM (${query}) AS all_notes WHERE title ILIKE $2 OR content ILIKE $2`;
            params.push(`%${search}%`);
        }

        const notes = await pool.query(query, params);
        res.status(200).json(notes.rows);
    } catch (err) {
        res.status(500).send("Server error.");
    }
};


// Delete a specific note
exports.deleteNote = async (req, res) => {
    const { id } = req.params; 
    const userId = req.user.userId; //  uuid comes from middleware (for security used middleware)

    try {
        
        const deletedNote = await pool.query(
            "DELETE FROM notes WHERE id = $1 AND user_id = $2 RETURNING *",
            [id, userId]
        );

        if (deletedNote.rows.length === 0) {
            return res.status(404).json({ message: "Note not found or unauthorized" });
        }

        res.status(200).json({ message: "Note deleted successfully" });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error during deletion" });
    }
};


exports.updateNote = async (req, res) => {
    const { id } = req.params; // note id
    const { title, content } = req.body; // new title and content
    const userId = req.user.userId; // user uid

    try {
        const updatedNote = await pool.query(
            "UPDATE notes SET title = $1, content = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND user_id = $4 RETURNING *",
            [title, content, id, userId]
        );

        if (updatedNote.rows.length === 0) {
            return res.status(404).json({ message: "Note not found or unauthorized" });
        }

        res.status(200).json(updatedNote.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
};


exports.shareNote = async (req, res) => {
    const { id } = req.params; 
    const { email } = req.body; 
    const ownerId = req.user.userId;

    try {
        //Is there any user like this mail
        const userResult = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: "No person like that, incorret email." });
        }
        const sharedWithUserId = userResult.rows[0].id;

        //You only can share a note if its yours
        const noteOwnerCheck = await pool.query("SELECT * FROM notes WHERE id = $1 AND user_id = $2", [id, ownerId]);
        if (noteOwnerCheck.rows.length === 0) {
            return res.status(403).json({ message: "You cannot share this note." });
        }

        //you cannot share a note yourself
        if (sharedWithUserId === ownerId) {
            return res.status(400).json({ message: "You cannot share a note to yourself" });
        }

        const notificationMsg = `${req.user.username || 'A user'} share note with you.`;
        await pool.query(
            "INSERT INTO notifications (recipient_id, sender_id, note_id, message) VALUES ($1, $2, $3, $4)",
            [sharedWithUserId, ownerId, id, notificationMsg]
        );

        const io = req.app.get('socketio'); 
        const onlineUsers = req.app.get('onlineUsers'); //map structure
        
        const recipientSocketId = onlineUsers.get(sharedWithUserId);

        if (recipientSocketId) {
            
            io.to(recipientSocketId).emit('new_notification', {
                title: 'New note shared!',
                message: `${req.user.username || 'Someone'} share a note with you.`,
                noteId: id //uuid when clicked
            });
        }

    

        res.status(200).json({ message: "Note successfully saved and notification sent." });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error.");
    }
};


exports.getUnreadNotifications = async (req, res) => {
    const userId = req.user.userId; // UUID
    try {
        const result = await pool.query(
            "SELECT * FROM notifications WHERE recipient_id = $1 AND is_read = FALSE ORDER BY created_at DESC",
            [userId]
        );
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).send("Server error.");
    }
};

// mark a specific notification as read
exports.markAsRead = async (req, res) => {
    const { id } = req.params; // notification id serial
    const userId = req.user.userId;

    try {
        const result = await pool.query(
            "UPDATE notifications SET is_read = TRUE WHERE id = $1 AND recipient_id = $2 RETURNING *",
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Notification not found or unauthorized access." });
        }

        res.status(200).json({ message: "Notification marked as read successfully." });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error occurred while updating notification status.");
    }
};

// mark all notifications as read for the user
exports.markAllAsRead = async (req, res) => {
    const userId = req.user.userId;

    try {
        await pool.query(
            "UPDATE notifications SET is_read = TRUE WHERE recipient_id = $1",
            [userId]
        );
        res.status(200).json({ message: "All notifications marked as read." });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error occurred while clearing notifications.");
    }
};