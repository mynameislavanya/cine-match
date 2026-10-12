
import { useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  Button,
  Chip,
  Stack,
  Alert,
} from '@mui/material';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import MovieCard from '../components/MovieCard';
import StateMessage from '../components/StateMessage';

const LANGUAGES = [
  'English',
  'Hindi',
  'Tamil',
  'Malayalam',
  'Telugu',
  'Kannada',
];

const GENRES = [
  'Action',
  'Comedy',
  'Drama',
  'Thriller',
  'Romance',
  'Crime',
  'Sci-Fi',
  'Family',
  'Mystery',
  'Biography',
  'Sport',
  'Fantasy',
  'Adventure',
];

export default function Recommendations() {
  const { user, updatePreferences } = useAuth();

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [languages, setLanguages] = useState(
    user?.favouriteLanguages || []
  );
  const [genres, setGenres] = useState(
    user?.favouriteGenres || []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = () => {
    setLoading(true);
    setError('');

    return api
      .get('/recommendations')
      .then(({ data }) => {
        setMovies(data);
      })
      .catch((err) => {
        console.error('Failed to load recommendations:', err);
        setMovies([]);
        setError(
          err.response?.data?.message ||
            'Unable to load recommendations. Please try again.'
        );
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = (list, setList, value) => {
    setList(
      list.includes(value)
        ? list.filter((v) => v !== value)
        : [...list, value]
    );
  };

  const savePreferences = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await updatePreferences({
        favouriteLanguages: languages,
        favouriteGenres: genres,
      });

      setSuccess('Your preferences have been saved.');
      await load();
    } catch (err) {
      console.error('Failed to save preferences:', err);
      setError(
        err.response?.data?.message ||
          'Unable to save preferences. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Typography variant="h4" sx={{ mb: 1 }}>
        Recommended for you
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 4, maxWidth: 560 }}
      >
        A transparent, rule-based match built from your favourite
        languages, favourite genres, and the movies you've rated
        highly - no black-box AI involved.
      </Typography>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3, maxWidth: 720 }}
          onClose={() => setError('')}
        >
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          sx={{ mb: 3, maxWidth: 720 }}
          onClose={() => setSuccess('')}
        >
          {success}
        </Alert>
      )}

      <Box
        sx={{
          mb: 4,
          p: 2.5,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          maxWidth: 720,
        }}
      >
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Favourite languages
        </Typography>

        <Stack
          direction="row"
          spacing={1}
          sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}
        >
          {LANGUAGES.map((l) => (
            <Chip
              key={l}
              label={l}
              clickable
              color={languages.includes(l) ? 'primary' : 'default'}
              onClick={() => toggle(languages, setLanguages, l)}
            />
          ))}
        </Stack>

        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Favourite genres
        </Typography>

        <Stack
          direction="row"
          spacing={1}
          sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}
        >
          {GENRES.map((g) => (
            <Chip
              key={g}
              label={g}
              clickable
              color={genres.includes(g) ? 'primary' : 'default'}
              onClick={() => toggle(genres, setGenres, g)}
            />
          ))}
        </Stack>

        <Button
          variant="contained"
          size="small"
          onClick={savePreferences}
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save preferences'}
        </Button>
      </Box>

      {loading ? (
        <StateMessage kind="loading" />
      ) : error && movies.length === 0 ? (
        <Typography color="text.secondary">
          Check your connection and try again.
        </Typography>
      ) : movies.length === 0 ? (
        <StateMessage
          title="Nothing to recommend yet"
          description="Rate a few movies or set your favourite languages and genres above."
        />
      ) : (
        <Grid container spacing={2.5}>
          {movies.map((m) => (
            <Grid item xs={6} sm={4} md={3} key={m._id}>
              <MovieCard movie={m} scoreLabel={m.matchReason} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
