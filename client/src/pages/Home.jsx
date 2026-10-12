import { Box, Container, Typography, Button, Stack, Grid } from '@mui/material';
import { Link } from 'react-router-dom';
import PosterFallback from '../components/PosterFallback';

// A small fixed set of titles for the hero's poster collage - purely decorative,
// independent of the live catalogue so the hero renders instantly with no API call.
const COLLAGE = [
  { title: 'Kantara', language: 'Kannada' },
  { title: 'Inception', language: 'English' },
  { title: '96', language: 'Tamil' },
  { title: 'Drishyam', language: 'Malayalam' },
  { title: 'RRR', language: 'Telugu' },
  { title: 'Andhadhun', language: 'Hindi' },
];

export default function Home() {
  return (
    <Container maxWidth="lg" sx={{ pt: { xs: 6, md: 10 }, pb: 10 }}>
      <Grid container spacing={6} alignItems="center">
        <Grid item xs={12} md={6}>
          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: '2.4rem', md: '3.2rem' },
              lineHeight: 1.1,
              mb: 3,
            }}
          >
            Find the film your whole group agrees on.
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 460, fontSize: '1.05rem' }}>
            Rate what you've watched, and CineMatch quietly learns your taste across six languages.
            Watching alone, get picks built for you. Watching with others, create a group and let
            everyone vote on the shortlist.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button variant="contained" size="large" component={Link} to="/browse">
              Browse the catalogue
            </Button>
            <Button variant="outlined" size="large" component={Link} to="/groups">
              Start a group
            </Button>
          </Stack>
        </Grid>

        <Grid item xs={12} md={6}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 2,
              transform: { md: 'rotate(1.5deg)' },
            }}
          >
            {COLLAGE.map((m, i) => (
              <Box
                key={m.title}
                sx={{
                  aspectRatio: '2 / 3',
                  mt: i % 2 === 1 ? 3 : 0,
                  boxShadow: '0 18px 40px rgba(0,0,0,0.45)',
                  borderRadius: 1.5,
                }}
              >
                <PosterFallback title={m.title} language={m.language} />
              </Box>
            ))}
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}
