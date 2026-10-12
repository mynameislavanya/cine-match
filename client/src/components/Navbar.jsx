import { AppBar, Toolbar, Typography, Button, Box, Stack } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppBar position="sticky" elevation={0}>
      <Toolbar sx={{ gap: 1 }}>
        <Typography
          component={Link}
          to="/"
          sx={{
            flexGrow: 1,
            fontFamily: '"Fraunces", Georgia, serif',
            fontWeight: 600,
            fontSize: '1.3rem',
            color: 'text.primary',
            textDecoration: 'none',
          }}
        >
          CineMatch
        </Typography>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Button color="inherit" component={Link} to="/browse">Browse</Button>
          {user ? (
            <>
              <Button color="inherit" component={Link} to="/recommendations">For you</Button>
              <Button color="inherit" component={Link} to="/watchlist">Watchlist</Button>
              <Button color="inherit" component={Link} to="/groups">Groups</Button>
              <Box sx={{ pl: 1 }}>
                <Button variant="outlined" size="small" onClick={handleLogout}>
                  Log out
                </Button>
              </Box>
            </>
          ) : (
            <>
              <Button color="inherit" component={Link} to="/login">Log in</Button>
              <Button variant="contained" size="small" component={Link} to="/register">
                Join free
              </Button>
            </>
          )}
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
