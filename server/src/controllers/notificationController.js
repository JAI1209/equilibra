const pool = require('../config/database');

const defaultNotifications = [
  'Mission completed! +10 points',
  'New team mission available',
  'Daily reminder: Complete your mission',
];

const ensureNotificationsTable = async (client) => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      message TEXT NOT NULL,
      is_read BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
};

const seedDefaultNotifications = async (client, userId) => {
  const result = await client.query(
    'SELECT COUNT(*)::int AS total FROM notifications WHERE user_id = $1',
    [userId]
  );

  if (result.rows[0].total > 0) return;

  for (const message of defaultNotifications) {
    await client.query(
      'INSERT INTO notifications (user_id, message) VALUES ($1, $2)',
      [userId, message]
    );
  }
};

const getNotifications = async (req, res) => {
  const client = await pool.connect();

  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Invalid user token' });
    }

    await ensureNotificationsTable(client);
    await seedDefaultNotifications(client, userId);

    const result = await client.query(
      `SELECT id, message, is_read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [userId]
    );

    res.json({ notifications: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

const markNotificationRead = async (req, res) => {
  const client = await pool.connect();

  try {
    const userId = req.user?.id;
    const notificationId = Number(req.params.id);

    if (!userId) {
      return res.status(401).json({ error: 'Invalid user token' });
    }

    if (!Number.isInteger(notificationId)) {
      return res.status(400).json({ error: 'Invalid notification id' });
    }

    await ensureNotificationsTable(client);

    const result = await client.query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE id = $1 AND user_id = $2
       RETURNING id, message, is_read, created_at`,
      [notificationId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ notification: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

module.exports = { getNotifications, markNotificationRead };
