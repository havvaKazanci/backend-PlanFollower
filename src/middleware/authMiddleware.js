const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    //taking token 
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'No token has found.' });
    }

    try {
        //solving token to take user info
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; //adding request object
        next(); //if everything ok past to next process
    } catch (err) {
        res.status(401).json({ message: 'Token is invalid.' });
    }
};

module.exports = authMiddleware;