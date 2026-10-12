// Transparent, rule-based recommendation engine - no AI/ML.
//
// Scoring rules (all weights are simple, explainable constants):
//  +3   the movie's language is one of the user's favourite languages
//  +1   per matching genre in the user's favourite genres
//  +up to 1 per genre the user has rated highly before (content-based signal)
//  +0.4 x the movie's own average rating (small popularity tie-breaker)
//
// Cold start: a user with no ratings and no saved preferences yet has every
// candidate score 0, so we fall back to ranking by overall popularity instead.

const Movie = require('../models/Movie');
const Rating = require('../models/Rating');
const Watchlist = require('../models/Watchlist');

// Builds { genre: weight } from movies this user rated 4 or 5 stars.
const buildGenreWeights = async (userId) => {
  const highRatings = await Rating.find({ user: userId, score: { $gte: 4 } }).populate('movie', 'genres');
  const weights = {};
  highRatings.forEach((r) => {
    (r.movie?.genres || []).forEach((g) => {
      weights[g] = (weights[g] || 0) + (r.score - 3) * 0.5; // 4 stars -> +0.5, 5 stars -> +1
    });
  });
  return weights;
};

const scoreMovieForUser = (movie, user, genreWeights) => {
  let score = 0;
  if (user.favouriteLanguages?.includes(movie.language)) score += 3;
  (movie.genres || []).forEach((g) => {
    if (user.favouriteGenres?.includes(g)) score += 1;
    if (genreWeights[g]) score += genreWeights[g];
  });
  score += (movie.avgRating || 0) * 0.4;
  return Math.round(score * 10) / 10;
};

// Returns up to `limit` recommended movies for one user, each annotated with matchScore.
const getRecommendationsForUser = async (user, { limit = 12 } = {}) => {
  const [ratedMovieIds, watchlistMovieIds, genreWeights, allMovies] = await Promise.all([
    Rating.find({ user: user._id }).distinct('movie'),
    Watchlist.find({ user: user._id }).distinct('movie'),
    buildGenreWeights(user._id),
    Movie.find({}),
  ]);

  const excluded = new Set([...ratedMovieIds, ...watchlistMovieIds].map(String));
  const candidates = allMovies.filter((m) => !excluded.has(String(m._id)));

  const scored = candidates.map((movie) => ({
    movie,
    score: scoreMovieForUser(movie, user, genreWeights),
  }));

  const hasSignal = scored.some((s) => s.score > 0);
  const ranked = hasSignal
    ? scored.sort((a, b) => b.score - a.score)
    : scored.sort((a, b) => (b.movie.avgRating - a.movie.avgRating) || (b.movie.ratingCount - a.movie.ratingCount));

  return ranked.slice(0, limit).map(({ movie, score }) => ({
    ...movie.toObject(),
    matchScore: score,
    matchReason: hasSignal
      ? 'Based on your favourite languages, genres and ratings'
      : 'Popular on CineMatch - rate a few movies or set your preferences for personalized picks',
  }));
};

module.exports = { getRecommendationsForUser, scoreMovieForUser, buildGenreWeights };
