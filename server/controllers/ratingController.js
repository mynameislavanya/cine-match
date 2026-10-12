const Rating = require('../models/Rating');
const Review = require('../models/Review');
const Movie = require('../models/Movie');
const asyncHandler = require('../utils/asyncHandler');

// Recalculates a movie's avgRating/ratingCount from all ratings.
const recalcAverage = async (movieId) => {
  const ratings = await Rating.find({ movie: movieId });
  const ratingCount = ratings.length;
  const avgRating = ratingCount
    ? Math.round((ratings.reduce((sum, r) => sum + r.score, 0) / ratingCount) * 10) / 10
    : 0;
  await Movie.findByIdAndUpdate(movieId, { avgRating, ratingCount });
};

// POST /api/movies/:id/rating  { score }
const rateMovie = asyncHandler(async (req, res) => {
  const { score } = req.body;
  if (!score || score < 1 || score > 5) {
    return res.status(400).json({ message: 'score must be a number between 1 and 5' });
  }

  const movie = await Movie.findById(req.params.id);
  if (!movie) return res.status(404).json({ message: 'Movie not found' });

  // Upsert: creates the rating, or updates it if this user already rated this movie
  // (prevents duplicate ratings per the spec).
  const rating = await Rating.findOneAndUpdate(
    { user: req.user._id, movie: movie._id },
    { score },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await recalcAverage(movie._id);
  res.json(rating);
});

// GET /api/movies/:id/rating/me
const getMyRating = asyncHandler(async (req, res) => {
  const rating = await Rating.findOne({ user: req.user._id, movie: req.params.id });
  res.json(rating || null);
});

// GET /api/movies/:id/reviews
const listReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ movie: req.params.id })
    .populate('user', 'name')
    .sort({ createdAt: -1 });
  res.json(reviews);
});

// POST /api/movies/:id/reviews  { text }
const addReview = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ message: 'Review text is required' });
  const review = await Review.create({ user: req.user._id, movie: req.params.id, text: text.trim() });
  await review.populate('user', 'name');
  res.status(201).json(review);
});

// PUT /api/reviews/:reviewId  { text }
const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.reviewId);
  if (!review) return res.status(404).json({ message: 'Review not found' });
  if (String(review.user) !== String(req.user._id)) {
    return res.status(403).json({ message: 'You can only edit your own review' });
  }
  if (req.body.text) review.text = req.body.text.trim();
  await review.save();
  res.json(review);
});

// DELETE /api/reviews/:reviewId
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.reviewId);
  if (!review) return res.status(404).json({ message: 'Review not found' });
  if (String(review.user) !== String(req.user._id)) {
    return res.status(403).json({ message: 'You can only delete your own review' });
  }
  await review.deleteOne();
  res.json({ message: 'Review deleted' });
});

module.exports = { rateMovie, getMyRating, listReviews, addReview, updateReview, deleteReview };
