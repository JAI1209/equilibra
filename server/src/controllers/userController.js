const pool = require('../config/database');

const getWarriorLevel = (score) => {
  if (score >= 250) return { name: 'Equilibra Guardian', minScore: 250, nextScore: 500 };
  if (score >= 100) return { name: 'Balance Warrior', minScore: 100, nextScore: 250 };
  if (score >= 50) return { name: 'Earth Sentinel', minScore: 50, nextScore: 100 };
  if (score >= 10) return { name: 'Seedling Warrior', minScore: 10, nextScore: 50 };
  return { name: 'Awakening Warrior', minScore: 0, nextScore: 10 };
};

const getProfile = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Invalid user token' });
    }

    const userResult = await pool.query(
      `SELECT id, username, email, location, 
       warriorship_score, avatar_url, bio
       FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const completedResult = await pool.query(
      'SELECT COUNT(*)::int AS total FROM mission_completions WHERE user_id = $1',
      [userId]
    );

    const user = userResult.rows[0];
    const score = user.warriorship_score || 0;
    const level = getWarriorLevel(score);

    res.json({
      username: user.username,
      email: user.email,
      location: user.location || 'Unknown',
      warrior_level: level.name,
      warriorship_score: score,
      missions_completed_count: completedResult.rows[0].total,
      avatar_url: user.avatar_url || null,
      bio: user.bio || '',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { bio, location, avatar_url } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Invalid user token' });
    }

    const result = await pool.query(
      `UPDATE users 
       SET bio = $1, location = $2, avatar_url = $3
       WHERE id = $4
       RETURNING id, username, email, location, bio, avatar_url`,
      [bio, location, avatar_url, userId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getProfile, updateProfile };