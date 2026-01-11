const pool = require('../config/db'); // database connection
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); //token create

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

const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        //Find if there a same email
        const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

        //401, No user like that
        if (user.rows.length === 0) {
            return res.status(401).json({ message: "Invalid Email or Password" });
        }

        //consider passwords with hash type: bcrypt
        const isMatch = await bcrypt.compare(password, user.rows[0].password_hash);

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid Email or Password" });
        }

        //When everything is ok, than create a JWT
        const token = jwt.sign(
            { userId: user.rows[0].id }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' } // Token 1 gün boyunca geçerli olsun
        );

        //Give result about info user
        res.status(200).json({
            message: "Login succesfull",
            token: token,
            user: {
                id: user.rows[0].id,
                name: user.rows[0].name,
                email: user.rows[0].email
            }
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error" });
    }
};

module.exports = { register, login }; 
