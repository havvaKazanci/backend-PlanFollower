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