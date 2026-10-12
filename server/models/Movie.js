const { defineModel } = require('./baseModel');

const LANGUAGES = ['English', 'Hindi', 'Tamil', 'Malayalam', 'Telugu', 'Kannada'];

module.exports = defineModel({
  name: 'Movie',
  table: 'movies',
  fields: {
    title: { type: 'string', required: true, trim: true, index: true },
    overview: { type: 'string', required: true },
    language: { type: 'string', enum: LANGUAGES, required: true, index: true },
    genres: { type: 'array', of: 'string' },
    year: { type: 'integer', required: true, index: true },
    // Left blank in the seed data on purpose - the frontend renders a designed
    // fallback poster when this is empty, so the app needs no external image API.
    posterUrl: { type: 'string', default: '' },
    cast: { type: 'array', of: 'string' },
    avgRating: { type: 'number', default: 0 },
    ratingCount: { type: 'number', default: 0 },
  },
  statics: { LANGUAGES },
});
