import { useEffect, useState } from 'react';
import { Container, Grid, TextField, MenuItem, Box, Pagination, Typography } from '@mui/material';
import api from '../services/api';
import MovieCard from '../components/MovieCard';
import StateMessage from '../components/StateMessage';

export default function Browse() {
  const [movies, setMovies] = useState([]);
  const [meta, setMeta] = useState({ languages: [], genres: [] });
  const [search, setSearch] = useState('');
  const [language, setLanguage] = useState('');
  const [genre, setGenre] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/movies/meta').then(({ data }) => setMeta(data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => {
      api
        .get('/movies', { params: { search, language, genre, page } })
        .then(({ data }) => {
          setMovies(data.movies);
          setPages(data.pages || 1);
        })
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, language, genre, page]);

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Browse the catalogue
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
        <TextField
          label="Search by title"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          sx={{ minWidth: 240 }}
        />
        <TextField
          select label="Language" value={language}
          onChange={(e) => { setLanguage(e.target.value); setPage(1); }}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">All languages</MenuItem>
          {meta.languages.map((l) => <MenuItem key={l} value={l}>{l}</MenuItem>)}
        </TextField>
        <TextField
          select label="Genre" value={genre}
          onChange={(e) => { setGenre(e.target.value); setPage(1); }}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">All genres</MenuItem>
          {meta.genres.map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>)}
        </TextField>
      </Box>

      {loading ? (
        <StateMessage kind="loading" />
      ) : movies.length === 0 ? (
        <StateMessage
          title="No movies match those filters"
          description="Try a different search term, or clear the language and genre filters."
        />
      ) : (
        <>
          <Grid container spacing={2.5}>
            {movies.map((m) => (
              <Grid item xs={6} sm={4} md={3} key={m._id}>
                <MovieCard movie={m} />
              </Grid>
            ))}
          </Grid>
          {pages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination count={pages} page={page} onChange={(e, v) => setPage(v)} shape="rounded" />
            </Box>
          )}
        </>
      )}
    </Container>
  );
}
