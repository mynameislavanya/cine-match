const { defineModel } = require('./baseModel');

module.exports = defineModel({
  name: 'Review',
  table: 'reviews',
  fields: {
    user: { type: 'ref', ref: 'User', required: true },
    movie: { type: 'ref', ref: 'Movie', required: true },
    text: { type: 'string', required: true, trim: true, maxlength: 2000 },
  },
  indexes: [{ fields: ['movie'] }],
});
