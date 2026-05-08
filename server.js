// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const compression = require('compression');
const authRoutes = require('./routes/authRoutes');
const userAuthRoutes = require('./routes/userAuthRoutes'); // ← new
const newsRoutes = require('./routes/newsRoutes');
const marketDataRoutes = require('./routes/marketDataRoutes');
const commentRoutes = require('./routes/commentRoutes');
const errorHandler = require('./middleware/errorHandler');
const { warmCache } = require('./controllers/newsController');

dotenv.config();

const app = express();

app.use(compression());
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.get('/api/health', (req, res) => res.json({ ok: true, timestamp: new Date() }));

// Routes
app.use('/api/auth', authRoutes);           // admin auth
app.use('/api/users/auth', userAuthRoutes); // regular user auth  ← new
app.use('/api/news', newsRoutes);
app.use('/api/market', marketDataRoutes);
app.use('/api/comments', commentRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
warmCache();
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});