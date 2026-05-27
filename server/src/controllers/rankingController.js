const pool = require('../config/database');

const getWarriorLevel = (score) => {
  if (score >= 250) return 'Equilibra Guardian';
  if (score >= 100) return 'Balance Warrior';
  if (score >= 50) return 'Earth Sentinel';
  if (score >= 10) return 'Seedling Warrior';
  return 'Awakening Warrior';
};

const getRankings = async (req, res) => {
  try {
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS warriorship_score INTEGER NOT NULL DEFAULT 0');

    const result = await pool.query(
      `SELECT username, location, warriorship_score
       FROM users
       ORDER BY warriorship_score DESC, username ASC
       LIMIT 10`
    );

    const rankings = result.rows.map((user, index) => ({
      rank: index + 1,
      username: user.username,
      location: user.location || 'Unknown',
      score: user.warriorship_score || 0,
      warrior_level: getWarriorLevel(user.warriorship_score || 0),
    }));

    res.json({ rankings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getRankings };
