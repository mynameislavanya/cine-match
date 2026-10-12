import { Box, Typography, CircularProgress } from '@mui/material';

// A single component for loading / empty / error states, so every page
// handles these consistently instead of each inventing its own.
export default function StateMessage({ kind = 'empty', title, description }) {
  if (kind === 'loading') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={28} sx={{ color: 'primary.main' }} />
      </Box>
    );
  }
  return (
    <Box sx={{ textAlign: 'center', py: 8, px: 2 }}>
      <Typography variant="h6" sx={{ fontFamily: '"Fraunces", serif', mb: 0.5 }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420, mx: 'auto' }}>
          {description}
        </Typography>
      )}
    </Box>
  );
}
