const pool = require('./db');

const createTables = async () => {
    const query = `
        -- Drop tables if they exist (to reset the database)
       -- DROP TABLE IF EXISTS user_stats CASCADE;
       -- DROP TABLE IF EXISTS users CASCADE;
        -- DROP TABLE IF EXISTS resources CASCADE;
       -- DROP TABLE IF EXISTS buildingTypes CASCADE;
       -- DROP TABLE IF EXISTS userBuildings CASCADE;

        -- Recreate users table
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) NOT NULL UNIQUE,
            email VARCHAR(100) NOT NULL UNIQUE,
            password TEXT NOT NULL,
            tribe VARCHAR(50) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            avatar TEXT
        );

        -- Recreate user_stats table
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
            credits INT DEFAULT 0,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS resources (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    wood INT DEFAULT 0,
    clay INT DEFAULT 0,
    iron INT DEFAULT 0,
    crops INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS buildingTypes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    requiredTownHallLevel INT DEFAULT 0,
    resourceCost JSONB NOT NULL,
    buildTime INT NOT NULL,
    upgradeRequirement INT[] DEFAULT NULL,
    stepCountingDuration INT[] DEFAULT NULL,
    troopsStorage INT DEFAULT NULL,
    productionRate INT DEFAULT NULL,
    baseStorage INT DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS userBuildings (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    buildingTypeId INT NOT NULL REFERENCES BuildingTypes(id),
    level INT DEFAULT 0,
    built BOOLEAN DEFAULT FALSE,
    location VARCHAR(20),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS userSteps (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    is_tracking BOOLEAN DEFAULT FALSE,
    tracking_start_time TIMESTAMP,  -- when the current session started
    steps_at_session_start INT DEFAULT 0, -- steps at session start (optional, but useful)
    stepsGained INT DEFAULT 0, -- total gained in this session
    totalSteps INT DEFAULT 0, -- total steps ever recorded
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS warriorTypes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    level INT DEFAULT 1,
    resourceCost JSONB NOT NULL, 
    trainingCost JSONB NOT NULL,
    trainingTime INT NOT NULL,
    upgradingTime INT NOT NULL,
    attack INT NOT NULL,
    defense INT NOT NULL,
    speed INT NOT NULL,
    requiredAcademyLevel INT NOT NULL,
    upgradeRequirements INT[] DEFAULT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS userWarriors (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id),
    warrior_type_id INT NOT NULL REFERENCES warriorTypes(id),

    name VARCHAR(50) NOT NULL,
    count INT DEFAULT 0,
    level INT DEFAULT 1,

    trainingCost JSONB NOT NULL,
    resourceCost JSONB NOT NULL,
    trainingTime INT NOT NULL,
    upgradingTime INT NOT NULL,
    attack INT NOT NULL,
    defense INT NOT NULL,
    speed INT NOT NULL,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(user_id, warrior_type_id)
);


CREATE TABLE IF NOT EXISTS warriorTrainingQueue (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id),
    warrior_type_id INT NOT NULL REFERENCES warriorTypes(id),
    count INT NOT NULL,
    finish_time TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS warriorUpgradeQueue (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id),
    warrior_type_id INT NOT NULL REFERENCES warriorTypes(id),
    upgrading_time INT NOT NULL,
    finish_time TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
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
