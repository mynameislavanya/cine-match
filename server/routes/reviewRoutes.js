const express = require('express');
const { protect } = require('../middleware/auth');
const { updateReview, deleteReview } = require('../controllers/ratingController');

// Mounted at /api/reviews in app.js
const router = express.Router();
router.put('/:reviewId', protect, updateReview);
router.delete('/:reviewId', protect, deleteReview);

module.exports = router;
