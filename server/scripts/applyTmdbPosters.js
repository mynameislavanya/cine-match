
require('dotenv').config({
  path: require('path').resolve(__dirname, '../.env'),
});

const fs = require('fs');
const path = require('path');
const Movie = require('../models/Movie');

const RESULTS_FILE = path.join(__dirname, 'tmdbPosterResults.json');

async function main() {
  if (!fs.existsSync(RESULTS_FILE)) {
    throw new Error('tmdbPosterResults.json was not found.');
  }

  const results = JSON.parse(
    fs.readFileSync(RESULTS_FILE, 'utf8')
  );

  const entries = Object.values(results);

  let updated = 0;
  let skipped = 0;

  console.log(`Found ${entries.length} saved movie results.\n`);

  for (const entry of entries) {
    const movieId = entry.movieId;
    const movieTitle = entry.movieTitle;
    const posterUrl = entry.candidates?.[0]?.posterUrl;

    if (!movieId || !posterUrl) {
      console.log(`SKIP: Missing movie ID or poster URL.`);
      skipped++;
      continue;
    }

    // Match the existing movie by its database ID.
    const movie = await Movie.findById(movieId);

    if (!movie) {
      console.log(`SKIP: Movie not found — ${movieTitle}`);
      skipped++;
      continue;
    }

    // Preserve any poster URL that is already saved.
    if (movie.posterUrl) {
      console.log(`SKIP: Existing poster preserved — ${movie.title}`);
      skipped++;
      continue;
    }

    // Update only the poster URL.
    movie.posterUrl = posterUrl;
    await movie.save();

    console.log(`UPDATED: ${movie.title}`);
    updated++;
  }

  console.log('\nPoster update complete.');
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
  console.log('No movie records were deleted or recreated.');
}

main().catch((error) => {
  console.error('Poster update failed:', error.message);
  process.exitCode = 1;
});
