const express = require('express');
const { protect } = require('../middleware/auth');
const { getMyRecommendations } = require('../controllers/recommendationController');

const router = express.Router();
router.get('/', protect, getMyRecommendations);

module.exports = router;
