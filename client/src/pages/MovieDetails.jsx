
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container, Grid, Typography, Rating, Box, TextField, Button,
  List, ListItem, ListItemText, Divider, Chip, Alert, Stack,
} from '@mui/material';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import PosterFallback from '../components/PosterFallback';
import StateMessage from '../components/StateMessage';

function MovieDetailPoster({ movie }) {
  const localPoster = `/posters/${movie.title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')}.jpg`;

  const [imageSource, setImageSource] = useState(
    movie.posterUrl || localPoster
  );
  const [showPlaceholder, setShowPlaceholder] = useState(false);

  useEffect(() => {
    setImageSource(movie.posterUrl || localPoster);
    setShowPlaceholder(false);
  }, [movie._id, movie.posterUrl, localPoster]);

  const handleImageError = () => {
    if (movie.posterUrl && imageSource === movie.posterUrl) {
      setImageSource(localPoster);
    } else {
      setShowPlaceholder(true);
    }
  };

  if (showPlaceholder) {
    return (
      <PosterFallback
        title={movie.title}
        language={movie.language}
      />
    );
  }

  return (
    <Box
      component="img"
      src={imageSource}
      alt={`${movie.title} poster`}
      onError={handleImageError}
      sx={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        display: 'block',
      }}
    />
  );
}

export default function MovieDetails() {
  const { id } = useParams();
  const { token, user } = useAuth();

  const [movie, setMovie] = useState(null);
  const [myRating, setMyRating] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [reviewText, setReviewText] = useState('');
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editingReviewText, setEditingReviewText] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [{ data: movieData }, { data: reviewData }] =
        await Promise.all([
          api.get(`/movies/${id}`),
          api.get(`/movies/${id}/reviews`),
        ]);

      setMovie(movieData);
      setReviews(reviewData);

      if (token) {
        const { data: ratingData } = await api.get(
          `/movies/${id}/rating/me`
        );
        setMyRating(ratingData?.score || 0);
      } else {
        setMyRating(0);
      }
    } catch (err) {
      setMessage(
        err.response?.data?.message || 'Could not load movie details'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleRate = async (value) => {
    setMyRating(value);

    try {
      await api.post(`/movies/${id}/rating`, { score: value });
      await loadData();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Could not save rating');
    }
  };

  const handleAddToWatchlist = async () => {
    try {
      await api.post('/watchlist', { movieId: id });
      setMessage('Added to your watchlist');
    } catch (err) {
      setMessage(
        err.response?.data?.message || 'Could not add to watchlist'
      );
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewText.trim()) return;

    try {
      await api.post(`/movies/${id}/reviews`, {
        text: reviewText.trim(),
      });
      setReviewText('');
      setMessage('Review posted successfully');
      await loadData();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Could not post review');
    }
  };

  const handleEditReview = async (reviewId) => {
    if (!editingReviewText.trim()) {
      setMessage('Review text cannot be empty');
      return;
    }

    try {
      await api.put(`/reviews/${reviewId}`, {
        text: editingReviewText.trim(),
      });

      setEditingReviewId(null);
      setEditingReviewText('');
      setMessage('Review updated successfully');
      await loadData();
    } catch (err) {
      setMessage(
        err.response?.data?.message || 'Could not update review'
      );
    }
  };

  const handleDeleteReview = async (reviewId) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this review?'
    );

    if (!confirmed) return;

    try {
      await api.delete(`/reviews/${reviewId}`);
      setMessage('Review deleted successfully');
      await loadData();
    } catch (err) {
      setMessage(
        err.response?.data?.message || 'Could not delete review'
      );
    }
  };

  if (loading) return <StateMessage kind="loading" />;
  if (!movie) return <StateMessage title="Movie not found" />;

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Grid container spacing={5}>
        <Grid item xs={12} sm={5} md={4}>
          <Box
            sx={{
              aspectRatio: '2 / 3',
              maxWidth: 340,
              boxShadow: '0 20px 48px rgba(0,0,0,0.5)',
              overflow: 'hidden',
            }}
          >
            <MovieDetailPoster movie={movie} />
          </Box>
        </Grid>

        <Grid item xs={12} sm={7} md={8}>
          <Typography
            variant="h3"
            sx={{ fontSize: { xs: '1.9rem', md: '2.4rem' } }}
          >
            {movie.title}
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mt: 0.5 }}
          >
            {movie.year} &middot; {movie.language}
          </Typography>

          <Stack
            direction="row"
            spacing={1}
            sx={{ my: 2, flexWrap: 'wrap', gap: 1 }}
          >
            {movie.genres?.map((g) => (
              <Chip key={g} label={g} size="small" />
            ))}
          </Stack>

          <Typography
            variant="body1"
            sx={{ mb: 2, maxWidth: 640, lineHeight: 1.7 }}
          >
            {movie.overview}
          </Typography>

          {movie.cast?.length > 0 && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 2 }}
            >
              Cast: {movie.cast.join(', ')}
            </Typography>
          )}

          <Typography variant="body2" sx={{ mb: 3 }}>
            Average rating:{' '}
            <strong>
              {movie.avgRating
                ? movie.avgRating.toFixed(1)
                : 'Not yet rated'}
            </strong>
            {movie.ratingCount > 0 &&
              ` (${movie.ratingCount} rating${
                movie.ratingCount === 1 ? '' : 's'
              })`}
          </Typography>

          {message && (
            <Alert
              severity="info"
              sx={{ mb: 2, maxWidth: 420 }}
              onClose={() => setMessage('')}
            >
              {message}
            </Alert>
          )}

          {token ? (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                Your rating
              </Typography>

              <Rating
                value={myRating}
                onChange={(e, value) => value && handleRate(value)}
              />

              <Box sx={{ mt: 1.5 }}>
                <Button
                  variant="outlined"
                  onClick={handleAddToWatchlist}
                >
                  Add to watchlist
                </Button>
              </Box>
            </Box>
          ) : (
            <Alert severity="info" sx={{ maxWidth: 420 }}>
              Log in to rate this movie, write a review, or add it to
              your watchlist.
            </Alert>
          )}
        </Grid>
      </Grid>

      <Divider sx={{ my: 5 }} />

      <Typography variant="h5" sx={{ mb: 2 }}>
        Reviews
      </Typography>

      {token && (
        <Box
          component="form"
          onSubmit={handleReviewSubmit}
          sx={{
            display: 'flex',
            gap: 2,
            mb: 3,
            maxWidth: 640,
          }}
        >
          <TextField
            fullWidth
            label="Share your thoughts"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
          />
          <Button
            type="submit"
            variant="contained"
            sx={{ whiteSpace: 'nowrap' }}
          >
            Post review
          </Button>
        </Box>
      )}

      {reviews.length === 0 ? (
        <Typography color="text.secondary">
          No reviews yet - be the first to share your thoughts.
        </Typography>
      ) : (
        <List sx={{ maxWidth: 640 }}>
          {reviews.map((r) => {
            const isOwner =
              r.user?._id &&
              user?._id &&
              String(r.user._id) === String(user._id);

            return (
              <ListItem
                key={r._id}
                alignItems="flex-start"
                disableGutters
                sx={{ display: 'block', py: 2 }}
              >
                <ListItemText
                  primary={r.user?.name || 'A viewer'}
                  secondary={
                    editingReviewId === r._id ? (
                      <TextField
                        fullWidth
                        multiline
                        minRows={2}
                        value={editingReviewText}
                        onChange={(e) =>
                          setEditingReviewText(e.target.value)
                        }
                        sx={{ mt: 1 }}
                      />
                    ) : (
                      r.text
                    )
                  }
                />

                {token && isOwner && (
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    {editingReviewId === r._id ? (
                      <>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleEditReview(r._id)}
                        >
                          Save
                        </Button>
                        <Button
                          size="small"
                          onClick={() => {
                            setEditingReviewId(null);
                            setEditingReviewText('');
                          }}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="small"
                        onClick={() => {
                          setEditingReviewId(r._id);
                          setEditingReviewText(r.text);
                        }}
                      >
                        Edit
                      </Button>
                    )}

                    <Button
                      size="small"
                      color="error"
                      onClick={() => handleDeleteReview(r._id)}
                    >
                      Delete
                    </Button>
                  </Stack>
                )}

                <Divider sx={{ mt: 2 }} />
              </ListItem>
            );
          })}
        </List>
      )}
    </Container>
  );
}
