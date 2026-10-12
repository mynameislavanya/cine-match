const { defineModel } = require('./baseModel');

module.exports = defineModel({
  name: 'Vote',
  table: 'votes',
  fields: {
    group: { type: 'ref', ref: 'Group', required: true },
    user: { type: 'ref', ref: 'User', required: true },
    movie: { type: 'ref', ref: 'Movie', required: true },
  },
  // One active vote per user per group - casting again updates it (vote can be changed pre-close).
  indexes: [{ fields: ['group', 'user'], unique: true }],
});
