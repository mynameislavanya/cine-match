const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getWatchlist, addToWatchlist, removeFromWatchlist, markWatched,
} = require('../controllers/watchlistController');

const router = express.Router();
router.use(protect);

router.get('/', getWatchlist);
router.post('/', addToWatchlist);
router.delete('/:movieId', removeFromWatchlist);
router.put('/:movieId/watched', markWatched);

module.exports = router;
