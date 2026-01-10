const pool = require('../config/db'); // database connection
const bcrypt = require('bcrypt');

const register = async (req, res) => {
    //destructing the android datas
    const { name, surname, email, password } = req.body;

    try {
        // check is there the email registered in 
        const userExist = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        
        if (userExist.rows.length > 0) {
            return res.status(400).json({ message: "This mail already used." });
        }

        // hashing password
        // saltRounds: 10 for safety 
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // add new user to the system
        // $1, $2 .. for sql injection (as I knowed I add this ones for now)
        const newUser = await pool.query(
            "INSERT INTO users (name, surname, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING *",
            [name, surname, email, hashedPassword]
        );

        // success message
        res.status(201).json({
            message: "User created successwfully.",
            userId: newUser.rows[0].id
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error, please try again." });
    }
};

module.exports = { register };