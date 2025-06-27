const pool = require("../db/connect");
const redis = require("../db/redis");

const getUsers = async (req, res) => {
    try {
        const { id } = req.user;
        
        const cacheKey = `seen_users:${id}`;

        let seenUsers = await redis.smembers(cacheKey);

        if (!seenUsers.length) {
            const result = await pool.query(
                "SELECT ARRAY(SELECT (value->>'user_id')::uuid FROM jsonb_array_elements(liked_users || disliked_users)) AS combined_user_ids FROM user_interactions WHERE user_id = $1;",
                [id]
            );
            seenUsers = result.rows[0]?.combined_user_ids || [];
            if (seenUsers.length) {
                await redis.sadd(cacheKey, ...seenUsers.map(String)); // Convert UUIDs to strings for Redis
            }
        }

        const query = `
            SELECT user_id, name, age, gender 
            FROM user_profiles 
            WHERE user_id <> $1
            AND gender NOT IN (SELECT gender FROM user_profiles WHERE user_id = $1)
            AND (array_length($2::uuid[], 1) IS NULL OR user_id NOT IN (SELECT unnest($2::uuid[])))
            ORDER BY RANDOM() 
            LIMIT 1
        `;

        const users = await pool.query(query, [ id, seenUsers]);

        if (users.rows.length) {
            const newUserIds = users.rows.map(user => user.user_id); // Collect new user IDs

            // Append new user IDs to Redis
            await redis.sadd(cacheKey, ...newUserIds);
            await redis.expire(cacheKey, 86400);
        }

        res.json(users.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
};

const likeUser = async (req, res) => {
    try {
        const { id: userId } = req.user;
        const { likedUserId } = req.body;
         // Check if the liked user has already liked this user
         const checkMatch = await pool.query(
            `SELECT user_id FROM user_interactions, jsonb_array_elements(liked_users) AS liked 
             WHERE user_id = $2 AND liked->>'user_id' = $1`,
            [userId, likedUserId]
        );
        if (checkMatch.rowCount > 0) {
            // Insert into matches table
            await pool.query(
                `INSERT INTO matches (user1_id, user2_id) VALUES ($1, $2) 
                 ON CONFLICT DO NOTHING`,
                [userId, likedUserId]
            );

            // Remove from liked_id to avoid duplication
            await pool.query(
                `UPDATE user_interactions 
                 SET liked_users = liked_users - jsonb_build_object('user_id', $2) 
                 WHERE user_id = $1`,
                [likedUserId, userId]
            );
        }
        else{
            await pool.query(
                `UPDATE user_interactions 
                 SET liked_users = liked_users || jsonb_build_object('user_id', $2, 'timestamp', NOW()) 
                 WHERE user_id = $1`,
                [userId, likedUserId]
            );
        }
        res.status(200).json({ message: "Like processed successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
};

module.exports={getUsers,likeUser}