const pool = require("../config/db");

// ✅ 1. Get all warrior types (for training menu)
const getAllWarriorTypes = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                id,
                name,
                level,
                resourceCost,
                trainingCost,
                trainingTime,
                upgradingTime,
                attack,
                defense,
                speed,
                requiredAcademyLevel,
                upgradeRequirements
            FROM warriorTypes
            ORDER BY id
        `);

        const formatted = result.rows.map(row => ({
            id: row.id,
            name: row.name,
            level: row.level,
            resourceCost: row.resourcecost,
            trainingCost: row.trainingcost,
            trainingTime: row.trainingtime,
            upgradingTime: row.upgradingtime,
            attack: row.attack,
            defense: row.defense,
            speed: row.speed,
            requiredAcademyLevel: row.requiredacademylevel,
            upgradeRequirements: row.upgraderequirements,
        }));

        console.log("✅ All warrior types fetched");
        res.json(formatted);
    } catch (err) {
        console.error('❌ Error getting warrior types:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ✅ 2. Get all user warriors (with their current state)
const getUserWarriors = async (req, res) => {
    const { userId } = req.params;

    try {
        const result = await pool.query(`
            SELECT * FROM userWarriors WHERE user_id = $1
        `, [userId]);

        res.json(result.rows);
    } catch (err) {
        console.error('❌ Error fetching user warriors:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ✅ 3. Add training entry to warriorTrainingQueue
const trainWarrior = async (req, res) => {
    const { userId, warriorTypeId, count } = req.body;

    if (!userId || !warriorTypeId || !count) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // ✅ Step 1: Get training time for this user's specific warrior type
        const warriorRes = await pool.query(
            `SELECT trainingtime FROM userWarriors WHERE user_id = $1 AND warrior_type_id = $2`,
            [userId, warriorTypeId]
        );

        if (warriorRes.rows.length === 0) {
            return res.status(404).json({ error: 'User warrior not found' });
        }

        const trainingTimePerUnit = warriorRes.rows[0].trainingtime;

        // ✅ Step 2: Compute total finish time
        const now = new Date();
        const finishTime = new Date(now.getTime() + trainingTimePerUnit * 1000 * count);

        // ✅ Step 3: Insert into training queue
        await pool.query(`
            INSERT INTO warriorTrainingQueue (user_id, warrior_type_id, count, finish_time)
            VALUES ($1, $2, $3, $4)
        `, [userId, warriorTypeId, count, finishTime]);

        res.json({
            message: `Training ${count} warriors started`,
            finishTime,
        });

    } catch (err) {
        console.error('❌ Error training warrior:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};



// ✅ 4. Add upgrade entry to warriorUpgradeQueue
const upgradeWarrior = async (req, res) => {
    const { userId, warriorTypeId, upgradingTime } = req.body;

    if (!userId || !warriorTypeId || !upgradingTime) {
        return res.status(400).json({ error: 'Missing upgrade fields' });
    }

    try {
        const finishTime = new Date(Date.now() + upgradingTime * 1000);

        await pool.query(`
            INSERT INTO warriorUpgradeQueue (user_id, warrior_type_id, upgrading_time, finish_time)
            VALUES ($1, $2, $3, $4)
        `, [userId, warriorTypeId, upgradingTime, finishTime]);

        res.json({ message: 'Warrior upgrade started', finishTime });
    } catch (err) {
        console.error('❌ Error upgrading warrior:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};


const applyWarriorUpgrades = async (req, res) => {
    const { userId } = req.params;

    try {
        const now = new Date();

        const result = await pool.query(`
        SELECT * FROM warriorUpgradeQueue
        WHERE user_id = $1 AND finish_time <= $2
      `, [userId, now]);

        const upgrades = result.rows;

        if (upgrades.length === 0) {
            return res.json({ message: "No completed upgrades." });
        }

        for (const upgrade of upgrades) {
            // Get the current user warrior
            const warriorRes = await pool.query(`
          SELECT * FROM userWarriors
          WHERE user_id = $1 AND warrior_type_id = $2
        `, [userId, upgrade.warrior_type_id]);

            const warrior = warriorRes.rows[0];
            const newLevel = warrior.level + 1;

            // Calculate scaled stats
            const costMultiplier = Math.pow(1.5, newLevel - 1);
            const timeMultiplier = Math.pow(1.2, newLevel - 1);
            const statMultiplier = Math.pow(1.1, newLevel - 1); // 10% per level

            const newTrainingCost = {
                crops: Math.floor(warrior.resourcecost.crops * costMultiplier),
                iron: Math.floor(warrior.resourcecost.iron * costMultiplier),
            };

            const newTrainingTime = Math.round(warrior.trainingtime * timeMultiplier);
            const newUpgradingTime = Math.round(warrior.upgradingtime * timeMultiplier);

            const newAttack = Math.round(warrior.attack * statMultiplier);
            const newDefense = Math.round(warrior.defense * statMultiplier);
            const newSpeed = Math.round(warrior.speed * statMultiplier); // Optional

            // Update userWarriors
            await pool.query(`
          UPDATE userWarriors
          SET 
            level = $1,
            trainingCost = $2,
            resourceCost = $3,
            trainingTime = $4,
            upgradingTime = $5,
            attack = $6,
            defense = $7,
            speed = $8
          WHERE user_id = $9 AND warrior_type_id = $10
        `, [
                newLevel,
                JSON.stringify(newTrainingCost),
                JSON.stringify(newTrainingCost),
                newTrainingTime,
                newUpgradingTime,
                newAttack,
                newDefense,
                newSpeed,
                userId,
                upgrade.warrior_type_id
            ]);

            // Remove the upgrade from queue
            await pool.query(`
          DELETE FROM warriorUpgradeQueue WHERE id = $1
        `, [upgrade.id]);
        }

        res.json({ message: `Applied ${upgrades.length} upgrade(s)` });
    } catch (err) {
        console.error("❌ Error applying upgrades:", err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const applyWarriorTraining = async (req, res) => {
    const { userId } = req.params;

    try {
        const now = new Date();

        const result = await pool.query(`
            SELECT * FROM warriorTrainingQueue
            WHERE user_id = $1 AND finish_time <= $2
        `, [userId, now]);

        const trainings = result.rows;

        if (trainings.length === 0) {
            return res.json({ message: "No completed trainings." });
        }

        for (const training of trainings) {
            // Increase count
            await pool.query(`
                UPDATE userWarriors
                SET count = count + $1
                WHERE user_id = $2 AND warrior_type_id = $3
            `, [training.count, userId, training.warrior_type_id]);

            // Delete from queue
            await pool.query(`
                DELETE FROM warriorTrainingQueue WHERE id = $1
            `, [training.id]);
        }

        res.json({ message: `Applied ${trainings.length} training(s)` });
    } catch (err) {
        console.error("❌ Error applying trainings:", err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getUserWarriorTrainingQueue = async (req, res) => {
    const { userId } = req.params;

    try {
        const result = await pool.query(`
            SELECT * FROM warriorTrainingQueue
            WHERE user_id = $1
            ORDER BY finish_time ASC
        `, [userId]);

        res.json(result.rows); // returns array of training entries
    } catch (err) {
        console.error('❌ Error fetching warrior training queue:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};





module.exports = {
    getAllWarriorTypes,
    getUserWarriors,
    trainWarrior,
    upgradeWarrior,
    applyWarriorUpgrades,
    applyWarriorTraining,
    getUserWarriorTrainingQueue
};

