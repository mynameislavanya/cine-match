const express = require('express');
const { protect } = require('../middleware/auth');
const { listReviews, addReview } = require('../controllers/ratingController');

// Mounted at /api/movies/:id/reviews in app.js
const router = express.Router({ mergeParams: true });
router.get('/', listReviews);
router.post('/', protect, addReview);

module.exports = router;
