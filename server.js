const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const pool = require('./config/db');
const createTables = require('./config/dbInit'); // Import table initializer

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Run database table check & creation on startup
createTables();

// Test database connection
pool.connect()
  .then(() => console.log('✅ Connected to PostgreSQL'))
  .catch(err => console.error('❌ Database connection error:', err));

// Routes
app.use('/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('Travian-style Game API is running!');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
