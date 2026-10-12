// Loads the 48 sample movies (server/data/sampleMovies.js) into SQLite.
// Safe to run multiple times: matches existing movies by title+year+language and
// skips them, so re-running never creates duplicates and never touches other data
// (ratings, reviews, users, groups, etc. are never read or modified by this script).
//
// Run with: npm run seed

require('dotenv').config();
const connectDB = require('../config/db');
const { closeDB } = require('../config/db');
const Movie = require('../models/Movie');
const movies = require('../data/sampleMovies');

const seed = async () => {
  console.log(`Connecting to SQLite...`);
  await connectDB();

  let created = 0;
  let skipped = 0;

  for (const movie of movies) {
    // eslint-disable-next-line no-await-in-loop
    const exists = await Movie.findOne({ title: movie.title, year: movie.year, language: movie.language });
    if (exists) {
      skipped += 1;
      continue;
    }
    // eslint-disable-next-line no-await-in-loop
    await Movie.create(movie);
    created += 1;
  }

  const total = await Movie.countDocuments();

  console.log('');
  console.log('Seed complete.');
  console.log(`  Created: ${created} new movie${created === 1 ? '' : 's'}`);
  console.log(`  Skipped (already present): ${skipped}`);
  console.log(`  Total movies now in the database: ${total}`);
  console.log('');

  closeDB();
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
