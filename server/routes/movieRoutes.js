const express = require('express');
const { listMovies, getMeta, getMovie } = require('../controllers/movieController');

const router = express.Router();

// /meta must be registered before /:id so "meta" isn't read as an id.
router.get('/meta', getMeta);
router.get('/', listMovies);
router.get('/:id', getMovie);

module.exports = router;
