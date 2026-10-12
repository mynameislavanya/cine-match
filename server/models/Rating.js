const { defineModel } = require('./baseModel');

module.exports = defineModel({
  name: 'Rating',
  table: 'ratings',
  fields: {
    user: { type: 'ref', ref: 'User', required: true },
    movie: { type: 'ref', ref: 'Movie', required: true },
    score: { type: 'number', required: true, min: 1, max: 5 },
  },
  // One rating per user per movie - re-rating updates this row instead of creating a new one.
  indexes: [{ fields: ['user', 'movie'], unique: true }],
});
