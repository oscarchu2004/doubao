const jwt = require('jsonwebtoken');

const authMiddleware = {
    authenticate: (req, res, next) => {
        const token = req.cookies.token; // Extract the token
        if (!token) {
            return res.status(401).json({ error: "MIDWARE ERROR: Unauthorized" });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded; // attach user info to the request
            // console.log(req.user);
            next();
        } catch (error) {
            res.status(401).json({ error: "MIDWARE ERROR: Invalid jwt token" });
        }
    },

    authorize: (role) => (req, res, next) => {
        if (req.user.role !== role) {
            return res.status(403).json({ error: "MIDWARE ERROR: Forbidden: Access denied," });
        }
        next();
    },
};
module.exports = authMiddleware;