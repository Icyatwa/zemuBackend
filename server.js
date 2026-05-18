// server.js
const dotenv = require('dotenv');
dotenv.config(); // ← must be first, before any other requires

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const compression = require('compression');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userAuthRoutes = require('./routes/userAuthRoutes');
const newsRoutes = require('./routes/newsRoutes');
const marketDataRoutes = require('./routes/marketDataRoutes');
const commentRoutes = require('./routes/commentRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const errorHandler = require('./middleware/errorHandler');
const { warmCache } = require('./controllers/newsController');
 
const app = express();

app.use(compression());

const corsOptions = {
  origin: (origin, callback) => {
    const allowed = [
      'https://palanomic.com',
      'palanomic.com', 
      'https://www.palanomic.com',
      'www.palanomic.com',
      'https://admin.palanomic.com',
      'https://addnfjdnfkdjnjkvdnjkvndfkj.palanomic.com',
      'www.addnfjdnfkdjnjkvdnjkvndfkj.palanomic.com',
      'addnfjdnfkdjnjkvdnjkvndfkj.palanomic.com',
      'https://addnfjdnfkdjnjkvdnjkvndfkj.palanomic.com/',
      'https://economy-frontend.vercel.app',
      'http://localhost:3000',
    ];
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.get('/api/health', (req, res) => res.json({ ok: true, timestamp: new Date() }));

// Routes
app.use('/api/auth',        authRoutes);
app.use('/api/users/auth',  userAuthRoutes);
app.use('/api/admin',       adminRoutes);
app.use('/api/news',        newsRoutes);
app.use('/api/market',      marketDataRoutes);
app.use('/api/comments',    commentRoutes);
app.use('/api/upload',      uploadRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
warmCache();
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});