
import { useState } from 'react';
import { Card, CardActionArea, Box, Typography, Stack } from '@mui/material';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import { Link } from 'react-router-dom';
import PosterFallback from './PosterFallback';

export default function MovieCard({ movie, scoreLabel }) {
  const localPoster = `/posters/${movie.title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')}.jpg`;

  const [imageSource, setImageSource] = useState(
    movie.posterUrl || localPoster
  );
  const [showPlaceholder, setShowPlaceholder] = useState(false);

  const handleImageError = () => {
    if (movie.posterUrl && imageSource === movie.posterUrl) {
      setImageSource(localPoster);
    } else {
      setShowPlaceholder(true);
    }
  };

  return (
    <Card
      sx={{
        height: '100%',
        transition: 'transform 180ms ease, border-color 180ms ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          borderColor: 'primary.main',
        },
      }}
    >
      <CardActionArea
        component={Link}
        to={`/movies/${movie._id}`}
        sx={{ height: '100%' }}
      >
        <Box sx={{ aspectRatio: '2 / 3', position: 'relative' }}>
          {!showPlaceholder ? (
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
          ) : (
            <PosterFallback
              title={movie.title}
              language={movie.language}
            />
          )}
        </Box>

        <Box sx={{ p: 1.5 }}>
          <Typography variant="subtitle2" noWrap title={movie.title}>
            {movie.title}
          </Typography>

          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mt: 0.5 }}
          >
            <Typography variant="caption" color="text.secondary">
              {movie.year}
            </Typography>

            <Stack direction="row" alignItems="center" spacing={0.3}>
              <StarRoundedIcon
                sx={{ fontSize: 16, color: 'primary.main' }}
              />
              <Typography variant="caption" color="text.secondary">
                {movie.avgRating ? movie.avgRating.toFixed(1) : 'New'}
              </Typography>
            </Stack>
          </Stack>

          {scoreLabel && (
            <Typography
              variant="caption"
              sx={{
                color: 'primary.main',
                display: 'block',
                mt: 0.5,
              }}
            >
              {scoreLabel}
            </Typography>
          )}
        </Box>
      </CardActionArea>
    </Card>
  );
}
