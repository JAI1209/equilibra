const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// REGISTER
const register = async (req, res) => {
  try {
    const { username, email, password, location } = req.body;
    
    // Password hash karo
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Database mein save karo
    const result = await pool.query(
      'INSERT INTO users (username, email, password, location) VALUES ($1, $2, $3, $4) RETURNING id, username, email',
      [username, email, hashedPassword, location]
    );
    
    const token = jwt.sign(
      { id: result.rows[0].id, email: result.rows[0].email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Warrior registered successfully!',
      token,
      user: result.rows[0]
    });
    
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// LOGIN
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // User dhundo
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    
    // Password check karo
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Token banao
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      message: 'Welcome back Warrior!',
      token,
      user: { id: user.id, username: user.username, email: user.email }
    });
    
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { register, login };
