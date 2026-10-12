// Loads every model so they're all registered (needed for table creation and populate).
require('./User');
require('./Movie');
require('./Rating');
require('./Review');
require('./Watchlist');
require('./Group');
require('./Vote');

module.exports = require('./baseModel');
