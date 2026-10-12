const bcrypt = require('bcryptjs');
const { defineModel } = require('./baseModel');

const LANGUAGES = ['English', 'Hindi', 'Tamil', 'Malayalam', 'Telugu', 'Kannada'];

module.exports = defineModel({
  name: 'User',
  table: 'users',
  fields: {
    name: { type: 'string', required: true, trim: true },
    email: { type: 'string', required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: 'string', required: true },
    favouriteGenres: { type: 'array', of: 'string' },
    favouriteLanguages: { type: 'array', of: 'string', enum: LANGUAGES },
  },
  methods: {
    comparePassword(candidate) {
      return bcrypt.compare(candidate, this.passwordHash);
    },
  },
  statics: {
    hashPassword(password) {
      return bcrypt.hash(password, 10);
    },
    LANGUAGES,
  },
});
