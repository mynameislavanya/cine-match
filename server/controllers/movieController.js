const Movie = require('../models/Movie');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/movies?search=&language=&genre=&page=&limit=
const listMovies = asyncHandler(async (req, res) => {
  const { search, language, genre, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (search) filter.title = { $regex: search, $options: 'i' };
  if (language) filter.language = language;
  if (genre) filter.genres = genre;

  const skip = (Number(page) - 1) * Number(limit);
  const [movies, total] = await Promise.all([
    Movie.find(filter).sort({ title: 1 }).skip(skip).limit(Number(limit)),
    Movie.countDocuments(filter),
  ]);

  res.json({ movies, total, page: Number(page), pages: Math.ceil(total / Number(limit)) || 1 });
});

// GET /api/movies/meta -> distinct languages/genres for building filter dropdowns
const getMeta = asyncHandler(async (req, res) => {
  const [languages, genres] = await Promise.all([
    Movie.distinct('language'),
    Movie.distinct('genres'),
  ]);
  res.json({ languages: languages.sort(), genres: genres.sort() });
});

// GET /api/movies/:id
const getMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.findById(req.params.id);
  if (!movie) return res.status(404).json({ message: 'Movie not found' });
  res.json(movie);
});

module.exports = { listMovies, getMeta, getMovie };
