const express = require('express');
const cors = require('cors');
const { notFound, errorHandler } = require('./middleware/error');

const authRoutes = require('./routes/authRoutes');
const movieRoutes = require('./routes/movieRoutes');
const watchlistRoutes = require('./routes/watchlistRoutes');
const ratingRoutes = require('./routes/ratingRoutes');
const movieReviewRoutes = require('./routes/movieReviewRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const groupRoutes = require('./routes/groupRoutes');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());

// Health check - lets you verify the API (and its DB connection) is actually running.
app.get('/api/health', (req, res) => {
  const { isConnected } = require('./config/db');
  res.json({
    status: 'ok',
    database: isConnected() ? 'connected' : 'not connected',
  });
});

// Temporary TMDB connection test
app.get('/api/tmdb-test', async (req, res) => {
  try {
    const apiKey = process.env.TMDB_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: 'TMDB API key is not configured',
      });
    }

    const response = await fetch(
      `https://api.themoviedb.org/3/configuration?api_key=${encodeURIComponent(apiKey)}`
    );

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: 'TMDB request failed. Check your API key.',
      });
    }

    res.json({
      success: true,
      message: 'TMDB connection successful!',
    });
  } catch (error) {
    console.error('TMDB connection test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Could not connect to TMDB',
    });
  }
});

// More specific paths are registered before the general /api/movies routes.
app.use('/api/auth', authRoutes);
app.use('/api/movies/:id/rating', ratingRoutes);
app.use('/api/movies/:id/reviews', movieReviewRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/groups', groupRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
