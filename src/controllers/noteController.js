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
        let query = "SELECT * FROM notes WHERE user_id = $1";
        let params = [userId];

        // Eğer arama terimi varsa sorguyu dinamikleştiriyoruz
        if (search) {
            query += " AND (title ILIKE $2 OR content ILIKE $2)";
            params.push(`%${search}%`);
        }
        
        query += " ORDER BY created_at DESC";

        const notes = await pool.query(query, params);
        res.status(200).json(notes.rows);
    } catch (err) {
        // Terminaldeki hatayı bu satır yazdırıyor
        console.error("Fetch Notes Error:", err.message); 
        res.status(500).send("Server Error");
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