
require('dotenv').config({
  path: require('path').resolve(__dirname, '../.env'),
});

const fs = require('fs');
const path = require('path');
const Movie = require('../models/Movie');

const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const RESULTS_FILE = path.join(__dirname, 'tmdbPosterResults.json');

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWithRetry(url, attempts = 3) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(15000),
      });

      if (response.status === 429 || response.status >= 500) {
        throw new Error(`TMDB temporarily returned ${response.status}`);
      }

      return response;
    } catch (error) {
      lastError = error;

      if (attempt < attempts) {
        console.log(`  Connection issue. Retry ${attempt + 1}/${attempts}...`);
        await sleep(attempt * 2000);
      }
    }
  }

  throw lastError;
}

async function main() {
  if (!process.env.TMDB_API_KEY) {
    throw new Error('TMDB_API_KEY is missing from server/.env');
  }

  const movies = await Movie.find({}).sort({ title: 1 });

  let savedResults = {};

  if (fs.existsSync(RESULTS_FILE)) {
    try {
      savedResults = JSON.parse(
        fs.readFileSync(RESULTS_FILE, 'utf8')
      );
    } catch {
      console.log('Previous results file could not be read; starting fresh.');
    }
  }

  console.log(`Found ${movies.length} existing movies.`);
  console.log('Searching TMDB. Your database will not be changed.\n');

  for (const movie of movies) {
    const movieKey = String(movie._id);

    if (savedResults[movieKey]?.checked) {
      console.log(`SKIP: ${movie.title} — already checked`);
      continue;
    }

    try {
      const params = new URLSearchParams({
        api_key: process.env.TMDB_API_KEY,
        query: movie.title,
      });

      if (movie.year) {
        params.set('year', String(movie.year));
      }

      const response = await fetchWithRetry(
        `https://api.themoviedb.org/3/search/movie?${params}`
      );

      if (!response.ok) {
        console.log(`ERROR: ${movie.title} — HTTP ${response.status}`);
        continue;
      }

      const data = await response.json();

      const candidates = (data.results || [])
        .filter((result) => result.poster_path)
        .slice(0, 3)
        .map((result) => ({
          tmdbId: result.id,
          title: result.title,
          releaseDate: result.release_date || '',
          posterUrl: `${IMAGE_BASE_URL}${result.poster_path}`,
        }));

      savedResults[movieKey] = {
        checked: true,
        movieId: movie._id,
        movieTitle: movie.title,
        year: movie.year,
        candidates,
      };

      console.log(
        candidates.length
          ? `FOUND: ${movie.title} — ${candidates.length} candidate(s)`
          : `NO POSTER FOUND: ${movie.title}`
      );

      fs.writeFileSync(
        RESULTS_FILE,
        JSON.stringify(savedResults, null, 2),
        'utf8'
      );

      await sleep(300);
    } catch (error) {
      console.log(`FAILED: ${movie.title} — ${error.message}`);
      console.log('Will retry this movie on the next run.');

      // Preserve earlier successful results and continue.
      fs.writeFileSync(
        RESULTS_FILE,
        JSON.stringify(savedResults, null, 2),
        'utf8'
      );
    }
  }

  console.log(`\nResults saved to: ${RESULTS_FILE}`);
  console.log('Preview complete. The movie database was not modified.');
}

main().catch((error) => {
  console.error('Poster search failed:', error.message);
  process.exitCode = 1;
});
