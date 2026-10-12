import { Box, Typography } from '@mui/material';
import { paletteForTitle } from '../theme/posterPalette';

// Renders a designed "poster card" in place of a real movie poster image.
// Used for every movie in this project since the catalogue ships with no
// external poster API - this is the deliberate fallback, not an error state.
export default function PosterFallback({ title, language, height = '100%' }) {
  const [from, to] = paletteForTitle(title);
  return (
    <Box
      sx={{
        position: 'relative',
        height,
        width: '100%',
        borderRadius: 1.5,
        overflow: 'hidden',
        background: `linear-gradient(165deg, ${from} 0%, ${to} 115%)`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        p: 1.5,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          position: 'absolute',
          top: 10,
          left: 10,
          bgcolor: 'rgba(11,18,32,0.55)',
          color: '#F1EEE6',
          px: 1,
          py: 0.25,
          borderRadius: 1,
          fontWeight: 500,
          letterSpacing: 0.2,
        }}
      >
        {language}
      </Typography>
      <Typography
        sx={{
          fontFamily: '"Fraunces", Georgia, serif',
          fontWeight: 600,
          fontSize: '1.05rem',
          lineHeight: 1.2,
          color: '#fff',
          textShadow: '0 2px 10px rgba(0,0,0,0.45)',
        }}
      >
        {title}
      </Typography>
    </Box>
  );
}
