const crypto = require('crypto');
const pool = require('../config/database');

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const getJournalUserId = (userId) => {
  const rawId = String(userId);

  if (uuidPattern.test(rawId)) {
    return rawId;
  }

  const hash = crypto.createHash('md5').update(`equilibra-user-${rawId}`).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
};

const ensureJournalTable = async (client) => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS journals (
      id SERIAL PRIMARY KEY,
      user_id UUID NOT NULL,
      entry_text TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
};

const getJournalEntries = async (req, res) => {
  const client = await pool.connect();

  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Invalid user token' });
    }

    await ensureJournalTable(client);

    const journalUserId = getJournalUserId(userId);
    const result = await client.query(
      `SELECT id, entry_text, created_at
       FROM journals
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 7`,
      [journalUserId]
    );

    res.json({ entries: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

const createJournalEntry = async (req, res) => {
  const client = await pool.connect();

  try {
    const userId = req.user?.id;
    const { entry_text } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Invalid user token' });
    }

    if (!entry_text || !entry_text.trim()) {
      return res.status(400).json({ error: 'Journal entry is required' });
    }

    await ensureJournalTable(client);

    const journalUserId = getJournalUserId(userId);
    const result = await client.query(
      `INSERT INTO journals (user_id, entry_text)
       VALUES ($1, $2)
       RETURNING id, entry_text, created_at`,
      [journalUserId, entry_text.trim()]
    );

    res.status(201).json({ entry: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

module.exports = { getJournalEntries, createJournalEntry };
