const pool = require('./db');

const createTables = async () => {
    const query = `
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) NOT NULL UNIQUE,
            email VARCHAR(100) NOT NULL UNIQUE,
            password TEXT NOT NULL,
            tribe VARCHAR(50) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

        CREATE TABLE IF NOT EXISTS user_stats (
            id SERIAL PRIMARY KEY,
            user_id INT REFERENCES users(id) ON DELETE CASCADE,
            level INT DEFAULT 1,
            experience INT DEFAULT 0,
            max_experience INT DEFAULT 100,
            health INT DEFAULT 100,
            max_health INT DEFAULT 100,
            strength INT DEFAULT 10,
            defense INT DEFAULT 10,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
    `;

    try {
        await pool.query(query);
        console.log("✅ Users and User Stats tables are ready!");
    } catch (err) {
        console.error("❌ Error creating tables:", err);
    }
};

module.exports = createTables;
