const pool = require('../config/database');

const ensureTeamMissionTables = async (client) => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS team_missions (
      id SERIAL PRIMARY KEY,
      creator_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      pillar TEXT NOT NULL,
      max_members INTEGER NOT NULL CHECK (max_members BETWEEN 2 AND 10),
      status TEXT NOT NULL DEFAULT 'open',
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS team_members (
      id SERIAL PRIMARY KEY,
      team_mission_id INTEGER NOT NULL REFERENCES team_missions(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE(team_mission_id, user_id)
    )
  `);
};

const mapMissionRow = (mission) => {
  const memberCount = Number(mission.member_count || 0);
  const maxMembers = Number(mission.max_members || 1);

  return {
    id: mission.id,
    title: mission.title,
    description: mission.description,
    pillar: mission.pillar,
    max_members: maxMembers,
    member_count: memberCount,
    progress: Math.min(100, Math.round((memberCount / maxMembers) * 100)),
    status: mission.status,
    created_at: mission.created_at,
    is_member: Boolean(mission.is_member),
  };
};

const listTeamMissions = async (req, res) => {
  const client = await pool.connect();

  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Invalid user token' });
    }

    await ensureTeamMissionTables(client);

    const result = await client.query(
      `SELECT
        tm.id,
        tm.title,
        tm.description,
        tm.pillar,
        tm.max_members,
        tm.status,
        tm.created_at,
        COUNT(tmem.id)::int AS member_count,
        BOOL_OR(tmem.user_id = $1)::boolean AS is_member
       FROM team_missions tm
       LEFT JOIN team_members tmem ON tmem.team_mission_id = tm.id
       WHERE tm.status = 'open'
       GROUP BY tm.id
       ORDER BY tm.created_at DESC`,
      [userId]
    );

    res.json({ team_missions: result.rows.map(mapMissionRow) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

const createTeamMission = async (req, res) => {
  const client = await pool.connect();

  try {
    const userId = req.user?.id;
    const { title, description, pillar, max_members } = req.body;
    const maxMembers = Number(max_members);

    if (!userId) {
      return res.status(401).json({ error: 'Invalid user token' });
    }

    if (!title?.trim() || !description?.trim() || !pillar?.trim()) {
      return res.status(400).json({ error: 'Title, description, and pillar are required' });
    }

    if (!Number.isInteger(maxMembers) || maxMembers < 2 || maxMembers > 10) {
      return res.status(400).json({ error: 'Max members must be between 2 and 10' });
    }

    await ensureTeamMissionTables(client);
    await client.query('BEGIN');

    const missionResult = await client.query(
      `INSERT INTO team_missions (creator_user_id, title, description, pillar, max_members)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, title.trim(), description.trim(), pillar.trim(), maxMembers]
    );

    const mission = missionResult.rows[0];

    await client.query(
      `INSERT INTO team_members (team_mission_id, user_id)
       VALUES ($1, $2)`,
      [mission.id, userId]
    );

    await client.query('COMMIT');

    res.status(201).json({
      team_mission: mapMissionRow({
        ...mission,
        member_count: 1,
        is_member: true,
      }),
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

const joinTeamMission = async (req, res) => {
  const client = await pool.connect();

  try {
    const userId = req.user?.id;
    const missionId = Number(req.params.id);

    if (!userId) {
      return res.status(401).json({ error: 'Invalid user token' });
    }

    if (!Number.isInteger(missionId)) {
      return res.status(400).json({ error: 'Invalid team mission id' });
    }

    await ensureTeamMissionTables(client);
    await client.query('BEGIN');

    const missionResult = await client.query(
      `SELECT *
       FROM team_missions
       WHERE id = $1 AND status = 'open'
       FOR UPDATE`,
      [missionId]
    );

    if (missionResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Open team mission not found' });
    }

    const mission = missionResult.rows[0];
    const countResult = await client.query(
      'SELECT COUNT(*)::int AS member_count FROM team_members WHERE team_mission_id = $1',
      [missionId]
    );
    const memberCount = countResult.rows[0].member_count;

    if (memberCount >= mission.max_members) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Team mission is already full' });
    }

    await client.query(
      `INSERT INTO team_members (team_mission_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (team_mission_id, user_id) DO NOTHING`,
      [missionId, userId]
    );

    const updatedCountResult = await client.query(
      'SELECT COUNT(*)::int AS member_count FROM team_members WHERE team_mission_id = $1',
      [missionId]
    );
    const updatedMemberCount = updatedCountResult.rows[0].member_count;

    if (updatedMemberCount >= mission.max_members) {
      await client.query(
        "UPDATE team_missions SET status = 'full' WHERE id = $1",
        [missionId]
      );
    }

    await client.query('COMMIT');

    res.json({
      team_mission: mapMissionRow({
        ...mission,
        status: updatedMemberCount >= mission.max_members ? 'full' : mission.status,
        member_count: updatedMemberCount,
        is_member: true,
      }),
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

module.exports = { createTeamMission, joinTeamMission, listTeamMissions };
