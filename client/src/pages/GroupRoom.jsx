import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Container, Typography, Box, Button, Grid, Chip, Stack, Alert, Paper, Divider,
} from '@mui/material';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import MovieCard from '../components/MovieCard';
import StateMessage from '../components/StateMessage';

export default function GroupRoom() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [myVote, setMyVote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isCreator = group && String(group.creator) === String(user?._id);

  const load = async () => {
    setLoading(true);
    const { data: groupData } = await api.get(`/groups/${id}`);
    setGroup(groupData);

    if (groupData.status === 'open') {
      const { data: recs } = await api.get(`/groups/${id}/recommendations`);
      setRecommendations(recs);
    } else if (groupData.status === 'closed') {
      navigate(`/groups/${id}/results`, { replace: true });
      return;
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const handleStartVoting = async () => {
    setError('');
    try {
      await api.post(`/groups/${id}/start-voting`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not start voting');
    }
  };

  const handleVote = async (movieId) => {
    setError('');
    try {
      await api.post(`/groups/${id}/vote`, { movieId });
      setMyVote(movieId);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not cast vote');
    }
  };

  const handleCloseVoting = async () => {
    setError('');
    try {
      await api.post(`/groups/${id}/close`);
      navigate(`/groups/${id}/results`);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not close voting');
    }
  };

  if (loading) return <StateMessage kind="loading" />;
  if (!group) return <StateMessage title="Group not found" />;

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Typography variant="overline" color="text.secondary">Group</Typography>
      <Typography variant="h4" sx={{ mb: 1 }}>{group.name}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Invite code <strong>{group.inviteCode}</strong> &middot; {group.members.length} member{group.members.length === 1 ? '' : 's'}
      </Typography>
      <Stack direction="row" spacing={1} sx={{ mb: 4 }}>
        {group.members.map((m) => <Chip key={m._id} label={m.name} size="small" />)}
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 3, maxWidth: 640 }} onClose={() => setError('')}>{error}</Alert>}

      {group.status === 'open' && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Group recommendations</Typography>
            {isCreator && (
              <Button variant="contained" onClick={handleStartVoting}>
                Start voting on the top 5
              </Button>
            )}
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 600 }}>
            Built by averaging every member's individual recommendation score - a movie that several of you
            would enjoy ranks above one only one person would like.
          </Typography>
          {recommendations.length === 0 ? (
            <StateMessage
              title="Not enough preference data yet"
              description="Ask group members to rate a few movies or set their favourite languages/genres, then check back."
            />
          ) : (
            <Grid container spacing={2.5}>
              {recommendations.map((m) => (
                <Grid item xs={6} sm={4} md={3} key={m._id}>
                  <MovieCard movie={m} scoreLabel={`Group match ${m.groupScore}`} />
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {group.status === 'voting' && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Vote on the shortlist</Typography>
            {isCreator && (
              <Button variant="contained" onClick={handleCloseVoting}>Close voting</Button>
            )}
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 600 }}>
            Pick your favourite from the shortlist below. You can change your vote until the creator closes voting.
          </Typography>
          <Grid container spacing={2.5}>
            {group.shortlist.map((m) => (
              <Grid item xs={6} sm={4} md={3} key={m._id}>
                <Box sx={{ position: 'relative' }}>
                  <MovieCard movie={m} />
                  <Button
                    fullWidth
                    size="small"
                    variant={myVote === m._id ? 'contained' : 'outlined'}
                    sx={{ mt: 1 }}
                    onClick={() => handleVote(m._id)}
                  >
                    {myVote === m._id ? 'Your vote' : 'Vote for this'}
                  </Button>
                </Box>
              </Grid>
            ))}
          </Grid>
          <Divider sx={{ my: 4 }} />
          <Paper variant="outlined" sx={{ p: 2.5, maxWidth: 480 }}>
            <Typography variant="body2" color="text.secondary">
              Want to see live results?{' '}
              <Link to={`/groups/${id}/results`} style={{ color: 'inherit' }}>View results so far</Link>
            </Typography>
          </Paper>
        </>
      )}
    </Container>
  );
}
