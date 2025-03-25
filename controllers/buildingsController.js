const pool = require("../config/db"); // ✅ Correct path to database connection

// ✅ Get all building types (for building menu)
const getAllBuildingTypes = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                id,
                name,
                requiredTownHallLevel,
                resourceCost,
                buildTime,
                upgradeRequirement,
                stepCountingDuration,
                troopsStorage,
                productionRate,
                baseStorage
            FROM BuildingTypes
            ORDER BY id
        `);

        const formatted = result.rows.map(row => ({
            id: row.id,
            name: row.name,
            requiredTownHallLevel: row.requiredtownhalllevel,
            resourceCost: row.resourcecost,
            buildTime: row.buildtime,
            upgradeRequirement: row.upgraderequirement,
            stepCountingDuration: row.stepcountingduration,
            troopsStorage: row.troopsstorage,
            productionRate: row.productionrate,
            baseStorage: row.basestorage,
        }));

        console.log("✅ All building types fetched:", formatted);

        res.json(formatted);
    } catch (err) {
        console.error('Error getting building types:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ✅ Get all buildings for a user
const getUserBuildings = async (req, res) => {
    const userId = req.params.userId;

    try {
        const result = await pool.query(`
            SELECT ub.*, bt.name, bt.requiredTownHallLevel, bt.resourceCost, bt.buildTime, bt.upgradeRequirement, bt.stepCountingDuration, bt.troopsStorage, bt.productionRate, bt.baseStorage
            FROM userBuildings ub
            JOIN BuildingTypes bt ON ub.buildingTypeId = bt.id
            WHERE ub.user_id = $1
        `, [userId]);

        res.json(result.rows);
    } catch (err) {
        console.error('Error getting user buildings:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ✅ Build a building (set built = true and set location)
const buildBuilding = async (req, res) => {
    const { userId, buildingTypeId, location, level } = req.body;

    try {
        const existing = await pool.query(`
            SELECT * FROM userBuildings 
            WHERE user_id = $1 AND buildingTypeId = $2
        `, [userId, buildingTypeId]);

        if (existing.rows.length > 0) {
            await pool.query(`
                UPDATE userBuildings 
                SET built = true, level = $1, location = $2, updated_at = CURRENT_TIMESTAMP 
                WHERE user_id = $3 AND buildingTypeId = $4
            `, [level, location, userId, buildingTypeId]);
        } else {
            await pool.query(`
                INSERT INTO userBuildings (user_id, buildingTypeId, built, level, location)
                VALUES ($1, $2, true, $3, $4)
            `, [userId, buildingTypeId, level, location]);
        }

        res.json({ message: 'Building constructed.' });
    } catch (err) {
        console.error('Error building:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};


// ✅ Upgrade a building
const upgradeBuilding = async (req, res) => {
    const { userId, buildingTypeId, level } = req.body;

    if (!level) {
        return res.status(400).json({ error: 'Missing level in request body' });
    }

    try {
        const result = await pool.query(`
            SELECT * FROM userBuildings 
            WHERE user_id = $1 AND buildingTypeId = $2
        `, [userId, buildingTypeId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Building not found' });
        }

        await pool.query(`
            UPDATE userBuildings 
            SET level = $1, updated_at = CURRENT_TIMESTAMP 
            WHERE user_id = $2 AND buildingTypeId = $3
        `, [level, userId, buildingTypeId]);

        res.json({ message: `Building upgraded to level ${level}` });
    } catch (err) {
        console.error('Error upgrading building:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};


// ✅ Export all functions
module.exports = {
    getUserBuildings,
    buildBuilding,
    upgradeBuilding,
    getAllBuildingTypes,
};

