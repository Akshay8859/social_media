const pool = require("./connect");

async function createTables() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          age INT CHECK (age >= 18), 
          gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
          address TEXT,
          interests JSONB,
          created_at TIMESTAMP DEFAULT NOW()
      );
      `);
      console.log("✅ Tables created successfully!");
  } catch (error) {
    console.error("❌ Error creating tables:", error);
  } finally {
    pool.end();
  }
}

module.exports={createTables}