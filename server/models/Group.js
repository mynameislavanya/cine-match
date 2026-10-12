const { defineModel } = require('./baseModel');

module.exports = defineModel({
  name: 'Group',
  table: 'groups',
  fields: {
    name: { type: 'string', required: true, trim: true },
    creator: { type: 'ref', ref: 'User', required: true },
    members: { type: 'array', of: 'ref', ref: 'User' },
    inviteCode: { type: 'string', required: true, unique: true },
    shortlist: { type: 'array', of: 'ref', ref: 'Movie' },
    status: { type: 'string', enum: ['open', 'voting', 'closed'], default: 'open' },
    winner: { type: 'ref', ref: 'Movie', default: null },
  },
});
