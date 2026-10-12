import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Typography, Box, LinearProgress, Stack, Paper, Chip } from '@mui/material';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import api from '../services/api';
import PosterFallback from '../components/PosterFallback';
import StateMessage from '../components/StateMessage';

export default function VotingResults() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/groups/${id}/results`).then(({ data }) => setData(data)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <StateMessage kind="loading" />;
  if (!data) return <StateMessage title="Results not found" />;

  const { group, results } = data;
  const totalVotes = results.reduce((sum, r) => sum + r.votes, 0) || 1;
  const sorted = [...results].sort((a, b) => b.votes - a.votes);

  return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      <Typography variant="overline" color="text.secondary">{group.name}</Typography>
      <Typography variant="h4" sx={{ mb: 1 }}>
        {group.status === 'closed' ? 'Voting results' : 'Live results'}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        <Link to={`/groups/${id}`} style={{ color: 'inherit' }}>Back to group</Link>
      </Typography>

      {group.status === 'closed' && group.winner && (
        <Paper
          variant="outlined"
          sx={{
            p: 3, mb: 4, display: 'flex', gap: 3, alignItems: 'center',
            borderColor: 'primary.main', bgcolor: 'rgba(203,161,53,0.06)',
          }}
        >
          <Box sx={{ width: 100, aspectRatio: '2 / 3', flexShrink: 0 }}>
            <PosterFallback title={group.winner.title} language={group.winner.language} />
          </Box>
          <Box>
            <Chip
              icon={<EmojiEventsRoundedIcon sx={{ color: 'primary.main !important' }} />}
              label="Winning movie" size="small" sx={{ mb: 1 }}
            />
            <Typography variant="h5">{group.winner.title}</Typography>
            <Typography variant="body2" color="text.secondary">{group.winner.year} &middot; {group.winner.language}</Typography>
          </Box>
        </Paper>
      )}

      <Stack spacing={2.5}>
        {sorted.map(({ movie, votes }) => (
          <Box key={movie._id}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body1">{movie.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                {votes} vote{votes === 1 ? '' : 's'}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={(votes / totalVotes) * 100}
              sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.06)' }}
            />
          </Box>
        ))}
      </Stack>

      {group.status === 'voting' && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>
          Voting is still open - these numbers will update once more members vote, and the final winner
          is set when the group creator closes voting.
        </Typography>
      )}
    </Container>
  );
}
