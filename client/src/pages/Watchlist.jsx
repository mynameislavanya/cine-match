
import { useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  Button,
  Chip,
  Alert,
} from '@mui/material';
import api from '../services/api';
import MovieCard from '../components/MovieCard';
import StateMessage from '../components/StateMessage';

export default function Watchlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState({});

  const load = () => {
    setLoading(true);
    setError('');

    return api
      .get('/watchlist')
      .then(({ data }) => {
        setItems(data);
      })
      .catch((err) => {
        console.error('Failed to load watchlist:', err);
        setItems([]);
        setError(
          err.response?.data?.message ||
            'Unable to load your watchlist. Please try again.'
        );
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, []);

  const handleRemove = async (movieId) => {
    setError('');
    setActionLoading((prev) => ({ ...prev, [movieId]: true }));

    try {
      await api.delete(`/watchlist/${movieId}`);
      setItems((prev) =>
        prev.filter((item) => item.movie._id !== movieId)
      );
    } catch (err) {
      console.error('Failed to remove movie:', err);
      setError(
        err.response?.data?.message ||
          'Unable to remove the movie. Please try again.'
      );
    } finally {
      setActionLoading((prev) => ({ ...prev, [movieId]: false }));
    }
  };

  const handleWatched = async (movieId) => {
    setError('');
    setActionLoading((prev) => ({ ...prev, [movieId]: true }));

    try {
      await api.put(`/watchlist/${movieId}/watched`);

      setItems((prev) =>
        prev.map((item) =>
          item.movie._id === movieId
            ? { ...item, watched: true }
            : item
        )
      );
    } catch (err) {
      console.error('Failed to mark movie as watched:', err);
      setError(
        err.response?.data?.message ||
          'Unable to update the movie. Please try again.'
      );
    } finally {
      setActionLoading((prev) => ({ ...prev, [movieId]: false }));
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        My watchlist
      </Typography>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          onClose={() => setError('')}
        >
          {error}
        </Alert>
      )}

      {loading ? (
        <StateMessage kind="loading" />
      ) : error && items.length === 0 ? (
        <Typography color="text.secondary">
          Check your connection and try again.
        </Typography>
      ) : items.length === 0 ? (
        <StateMessage
          title="Your watchlist is empty"
          description="Browse the catalogue and add a few movies you want to watch later."
        />
      ) : (
        <Grid container spacing={2.5}>
          {items.map((item) => (
            <Grid item xs={6} sm={4} md={3} key={item._id}>
              <Box sx={{ position: 'relative' }}>
                <MovieCard movie={item.movie} />

                {item.watched && (
                  <Chip
                    label="Watched"
                    color="primary"
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                    }}
                  />
                )}

                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  {!item.watched && (
                    <Button
                      size="small"
                      disabled={Boolean(actionLoading[item.movie._id])}
                      onClick={() => handleWatched(item.movie._id)}
                    >
                      {actionLoading[item.movie._id]
                        ? 'Updating…'
                        : 'Mark watched'}
                    </Button>
                  )}

                  <Button
                    size="small"
                    color="secondary"
                    disabled={Boolean(actionLoading[item.movie._id])}
                    onClick={() => handleRemove(item.movie._id)}
                  >
                    Remove
                  </Button>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
