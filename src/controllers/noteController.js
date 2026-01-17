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

    try {
        // fetch notes belonging to this user, sorted by newest first
        const notes = await pool.query(
            "SELECT * FROM notes WHERE user_id = $1 ORDER BY created_at DESC",
            [userId]
        );

        res.status(200).json(notes.rows);
    } catch (err) {
        console.error("Fetch Notes Error:", err.message);
        res.status(500).json({ error: "Server error while fetching notes" });
    }
};