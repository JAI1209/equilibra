const pool = require('../config/database');

const getPosts = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, u.username 
      FROM posts p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
      LIMIT 50
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createPost = async (req, res) => {
  try {
    const { description, pillar, image_url } = req.body;
    const userId = req.user.id;
    const result = await pool.query(
      'INSERT INTO posts (user_id, description, pillar, image_url) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, description, pillar, image_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getPosts, createPost };