const pool = require("../db/connect");
const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await pool.query(
            "SELECT user_id, name, age, gender, address, interests FROM user_profiles WHERE user_id = $1",
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};
const getUserProfile = async (req, res) => {
    try {
        const { userId } = req.params; // Get user ID from request params
      
        const result = await pool.query(
            "SELECT user_id, name, age, gender, address, interests FROM user_profiles WHERE user_id = $1",
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};
const updateProfile = async (req, res) => {
    try {
        const { name, age, gender, address, interests } = req.body;
        const userId = req.user.id;  // Get user ID from token

        // Check if user already has a profile
        const existingUser = await pool.query("SELECT user_id FROM user_profiles WHERE user_id = $1", [userId]);

        if (existingUser.rowCount > 0) {
            // If user exists, update profile
            await pool.query(
                `UPDATE user_profiles SET name = $1, age = $2, gender = $3, address = $4, interests = $5 WHERE user_id = $6`,
                [name, age, gender, address, JSON.stringify(interests), userId]
            );
            return res.status(200).json({ message: "Profile updated successfully" });
        } else {
            // If user does not exist, create new profile
            await pool.query(
                `INSERT INTO user_profiles (user_id, name, age, gender, address, interests) VALUES ($1, $2, $3, $4, $5, $6)`,
                [userId, name, age, gender, address, JSON.stringify(interests)]
            );
            return res.status(201).json({ message: "Profile created successfully" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports={getProfile,getUserProfile,updateProfile}