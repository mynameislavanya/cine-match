import { createTheme } from '@mui/material/styles';

// Design tokens
// Background:  #0B1220 (deep navy-charcoal) / surface #131B2C / raised #182239
// Accent:      #CBA135 (warm muted gold) - used sparingly, as the one bold element
// Text:        #F1EEE6 (warm off-white) / muted #99A2B8
// Type:        Fraunces for display/headlines (editorial, cinematic), Inter for UI/body
export const tokens = {
  bg: '#0B1220',
  surface: '#131B2C',
  raised: '#182239',
  border: '#232C42',
  gold: '#CBA135',
  goldSoft: 'rgba(203,161,53,0.14)',
  text: '#F1EEE6',
  textMuted: '#99A2B8',
};

const theme = createTheme({
  palette: {
    mode: 'dark',
    background: { default: tokens.bg, paper: tokens.surface },
    primary: { main: tokens.gold, contrastText: '#17120A' },
    secondary: { main: '#6E7A96' },
    text: { primary: tokens.text, secondary: tokens.textMuted },
    divider: tokens.border,
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
    h1: { fontFamily: '"Fraunces", Georgia, serif', fontWeight: 600 },
    h2: { fontFamily: '"Fraunces", Georgia, serif', fontWeight: 600 },
    h3: { fontFamily: '"Fraunces", Georgia, serif', fontWeight: 600 },
    h4: { fontFamily: '"Fraunces", Georgia, serif', fontWeight: 600 },
    h5: { fontFamily: '"Fraunces", Georgia, serif', fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: tokens.bg },
        '::selection': { backgroundColor: tokens.goldSoft },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(11,18,32,0.9)',
          backdropFilter: 'blur(8px)',
          borderBottom: `1px solid ${tokens.border}`,
          boxShadow: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: tokens.surface,
          border: `1px solid ${tokens.border}`,
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, paddingLeft: 18, paddingRight: 18 },
        containedPrimary: {
          '&:hover': { backgroundColor: '#B8902C' },
        },
        outlined: { borderColor: tokens.border },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 6, fontWeight: 500 },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined' },
    },
  },
});

export default theme;
