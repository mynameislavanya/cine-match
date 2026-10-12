const express = require('express');
const { protect } = require('../middleware/auth');
const { rateMovie, getMyRating } = require('../controllers/ratingController');

// Mounted at /api/movies/:id/rating in app.js
const router = express.Router({ mergeParams: true });
router.post('/', protect, rateMovie);
router.get('/me', protect, getMyRating);

module.exports = router;
