import { useEffect, useState } from 'react';
import { Container, Grid, Typography, Box, Button, Chip } from '@mui/material';
import api from '../services/api';
import MovieCard from '../components/MovieCard';
import StateMessage from '../components/StateMessage';

export default function Watchlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/watchlist').then(({ data }) => setItems(data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleRemove = async (movieId) => {
    await api.delete(`/watchlist/${movieId}`);
    load();
  };

  const handleWatched = async (movieId) => {
    await api.put(`/watchlist/${movieId}/watched`);
    load();
  };

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>My watchlist</Typography>

      {loading ? (
        <StateMessage kind="loading" />
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
                  <Chip label="Watched" color="primary" size="small" sx={{ position: 'absolute', top: 8, left: 8 }} />
                )}
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  {!item.watched && (
                    <Button size="small" onClick={() => handleWatched(item.movie._id)}>Mark watched</Button>
                  )}
                  <Button size="small" color="secondary" onClick={() => handleRemove(item.movie._id)}>Remove</Button>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
