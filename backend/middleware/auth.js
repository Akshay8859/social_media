const jwt = require('jsonwebtoken');
//const {UnauthenticatedError} = require('../errors');


const authenticationMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(404).send("Session expired");
    }
    
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(404).send("Session expired");
    }
}

module.exports = authenticationMiddleware;
