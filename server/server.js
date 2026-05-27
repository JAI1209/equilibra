const express = require('express');
const cors = require('cors');
require('dotenv').config();
require('./src/config/database');

const app = express();

app.use(cors());
app.use(express.json({ limit: '8mb' }));


const postRoutes = require('./src/routes/postRoutes');
app.use('/api/posts', postRoutes);



const authRoutes = require('./src/routes/authRoutes');
app.use('/api/auth', authRoutes);

const missionRoutes = require('./src/routes/missionRoutes');
app.use('/api/missions', missionRoutes);

const userRoutes = require('./src/routes/userRoutes');
app.use('/api/users', userRoutes);

const rankingRoutes = require('./src/routes/rankingRoutes');
app.use('/api/rankings', rankingRoutes);

const journalRoutes = require('./src/routes/journalRoutes');
app.use('/api/journal', journalRoutes);

const teamMissionRoutes = require('./src/routes/teamMissionRoutes');
app.use('/api/team-missions', teamMissionRoutes);

const notificationRoutes = require('./src/routes/notificationRoutes');
app.use('/api/notifications', notificationRoutes);


app.get('/', (req, res) => {
  res.json({ message: 'Equilibra API is running!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Equilibra server running on port ${PORT}`);
});
