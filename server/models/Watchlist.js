const { defineModel } = require('./baseModel');

module.exports = defineModel({
  name: 'Watchlist',
  table: 'watchlists',
  fields: {
    user: { type: 'ref', ref: 'User', required: true },
    movie: { type: 'ref', ref: 'Movie', required: true },
    watched: { type: 'boolean', default: false },
  },
  indexes: [{ fields: ['user', 'movie'], unique: true }],
});
