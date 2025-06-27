const jwt = require('jsonwebtoken');
const bcrypt=require('bcrypt')

const pool = require("../db/connect");

// Generate access and refresh tokens
const generateTokens = (user) => {
    const accessToken = jwt.sign(
        { id: user.id, email: user.email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
        { id: user.id, email: user.email },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "7d" }
    );

    return { accessToken, refreshToken };
};

// Signup function
const signUp = async (req, res) => {
    try {
        const { email, password } = req.body;
        

        // Check if user exists
        const existingUser = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Create user
        const newUser = await pool.query(
            "INSERT INTO users ( email, password,refresh_token) VALUES ($1, $2, $3) RETURNING *",
            [email, hashedPassword,null]
        );

        const { accessToken, refreshToken } = generateTokens(newUser.rows[0]);

        // Store refresh token in DB
        await pool.query("UPDATE users SET refresh_token = $1 WHERE id = $2", [refreshToken, newUser.rows[0].id]);
        
        res.status(201).json({ message: "User registered successfully", accessToken, refreshToken });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// Login function
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Get user from DB
        const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (user.rows.length === 0) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
       
        // Compare password
        const isPasswordValid = await bcrypt.compare(password, user.rows[0].password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const { accessToken, refreshToken } = generateTokens(user.rows[0]);

        // Store the latest refresh token (invalidates previous sessions)
        await pool.query("UPDATE users SET refresh_token = $1 WHERE id = $2", [refreshToken, user.rows[0].id]);

        res.json({ message: "Login successful", accessToken, refreshToken });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

const refreshToken = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(401).json({ message: "No token provided" });

        // Verify token first
        jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
            if (err) return res.status(403).json({ message: "Invalid refresh token" });

            // Fetch user by email from decoded token
            const user = await pool.query("SELECT * FROM users WHERE email = $1", [decoded.email]);
            if (user.rows.length === 0) return res.status(403).json({ message: "User not found" });

            // Check if the refresh token matches the one stored in DB
            if (user.rows[0].refresh_token !== token) {
                return res.status(403).json({ message: "Invalid session, please login again" });
            }

            // Generate new access token
            const newAccessToken = jwt.sign(
                { id: user.rows[0].id, email: user.rows[0].email },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: "15m" }
            );

            res.json({ accessToken: newAccessToken });
        });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};
const logOut = async (req, res) => {
    try {
        const userId = req.user.id;

        // Remove refresh token from database
        await pool.query('UPDATE users SET refresh_token = NULL WHERE id = $1', [userId]);

        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
module.exports = { signUp, login, refreshToken,logOut };