const pool = require('../config/database');

// Get all missions
const getMissions = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM missions');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create mission
const createMission = async (req, res) => {
  try {
    const { title, description, pillar, difficulty, points } = req.body;
    const result = await pool.query(
      'INSERT INTO missions (title, description, pillar, difficulty, points) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, description, pillar, difficulty, points]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Complete mission with photo proof
const completeMission = async (req, res) => {
  const client = await pool.connect();

  try {
    const userId = req.user?.id;
    const { missionId, proof } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Invalid user token' });
    }

    if (!missionId) {
      return res.status(400).json({ error: 'Mission id is required' });
    }

    if (!proof?.dataUrl || !proof?.mimeType || !proof.mimeType.startsWith('image/')) {
      return res.status(400).json({ error: 'Photo proof is required' });
    }

    await client.query('BEGIN');
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS warriorship_score INTEGER NOT NULL DEFAULT 0');
    await client.query(`
      CREATE TABLE IF NOT EXISTS missions (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        pillar TEXT,
        difficulty TEXT,
        points INTEGER NOT NULL DEFAULT 10
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS mission_completions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        mission_id TEXT NOT NULL,
        proof_file_name TEXT,
        proof_mime_type TEXT,
        proof_data_url TEXT NOT NULL,
        points_awarded INTEGER NOT NULL DEFAULT 10,
        completed_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    let pointsAwarded = 10;
    const missionResult = await client.query(
      'SELECT points FROM missions WHERE id::text = $1 LIMIT 1',
      [String(missionId)]
    );

    if (missionResult.rows.length > 0 && Number.isFinite(Number(missionResult.rows[0].points))) {
      pointsAwarded = Number(missionResult.rows[0].points);
    }

    await client.query(
      `INSERT INTO mission_completions
        (user_id, mission_id, proof_file_name, proof_mime_type, proof_data_url, points_awarded)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        userId,
        String(missionId),
        proof.fileName || null,
        proof.mimeType,
        proof.dataUrl,
        pointsAwarded,
      ]
    );

    const updatedUser = await client.query(
      `UPDATE users
       SET warriorship_score = warriorship_score + $1
       WHERE id = $2
       RETURNING warriorship_score`,
      [pointsAwarded, userId]
    );

    await client.query('COMMIT');

    res.json({
      message: 'Mission completed successfully',
      pointsAwarded,
      warriorshipScore: updatedUser.rows[0].warriorship_score,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

module.exports = { getMissions, createMission, completeMission };
