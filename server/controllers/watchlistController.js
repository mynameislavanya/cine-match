const Watchlist = require('../models/Watchlist');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/watchlist
const getWatchlist = asyncHandler(async (req, res) => {
  const items = await Watchlist.find({ user: req.user._id }).populate('movie').sort({ createdAt: -1 });
  res.json(items);
});

// POST /api/watchlist  { movieId }
const addToWatchlist = asyncHandler(async (req, res) => {
  const { movieId } = req.body;
  if (!movieId) return res.status(400).json({ message: 'movieId is required' });

  try {
    const item = await Watchlist.create({ user: req.user._id, movie: movieId });
    res.status(201).json(item);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Already in your watchlist' });
    throw err;
  }
});

// DELETE /api/watchlist/:movieId
const removeFromWatchlist = asyncHandler(async (req, res) => {
  await Watchlist.findOneAndDelete({ user: req.user._id, movie: req.params.movieId });
  res.json({ message: 'Removed from watchlist' });
});

// PUT /api/watchlist/:movieId/watched
const markWatched = asyncHandler(async (req, res) => {
  const item = await Watchlist.findOneAndUpdate(
    { user: req.user._id, movie: req.params.movieId },
    { watched: true },
    { new: true }
  );
  if (!item) return res.status(404).json({ message: 'That movie is not in your watchlist' });
  res.json(item);
});

module.exports = { getWatchlist, addToWatchlist, removeFromWatchlist, markWatched };
