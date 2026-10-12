import { useEffect, useState } from 'react';
import {
  Container, Typography, Box, TextField, Button, Paper, Grid, Chip, Alert, Stack,
} from '@mui/material';
import { Link } from 'react-router-dom';
import api from '../services/api';
import StateMessage from '../components/StateMessage';

const STATUS_LABEL = { open: 'Open', voting: 'Voting', closed: 'Closed' };

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/groups').then(({ data }) => setGroups(data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) return;
    try {
      const { data } = await api.post('/groups', { name });
      setName('');
      setInfo(`Group created. Invite code: ${data.inviteCode}`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create group');
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setError('');
    if (!code.trim()) return;
    try {
      await api.post('/groups/join', { inviteCode: code });
      setCode('');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not join group');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>Groups</Typography>

      {error && <Alert severity="error" sx={{ mb: 3, maxWidth: 640 }} onClose={() => setError('')}>{error}</Alert>}
      {info && <Alert severity="success" sx={{ mb: 3, maxWidth: 640 }} onClose={() => setInfo('')}>{info}</Alert>}

      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid item xs={12} sm={6}>
          <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Create a group</Typography>
            <Box component="form" onSubmit={handleCreate} sx={{ display: 'flex', gap: 1.5 }}>
              <TextField fullWidth label="Group name" value={name} onChange={(e) => setName(e.target.value)} />
              <Button type="submit" variant="contained" sx={{ whiteSpace: 'nowrap' }}>Create</Button>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Join with an invite code</Typography>
            <Box component="form" onSubmit={handleJoin} sx={{ display: 'flex', gap: 1.5 }}>
              <TextField fullWidth label="Invite code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
              <Button type="submit" variant="outlined" sx={{ whiteSpace: 'nowrap' }}>Join</Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Typography variant="h6" sx={{ mb: 2 }}>My groups</Typography>
      {loading ? (
        <StateMessage kind="loading" />
      ) : groups.length === 0 ? (
        <StateMessage title="No groups yet" description="Create a group or join one with an invite code to get started." />
      ) : (
        <Stack spacing={2}>
          {groups.map((g) => (
            <Paper
              key={g._id} variant="outlined" component={Link} to={`/groups/${g._id}`}
              sx={{
                p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                textDecoration: 'none', color: 'inherit',
                '&:hover': { borderColor: 'primary.main' },
              }}
            >
              <Box>
                <Typography variant="subtitle1">{g.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {g.members.length} member{g.members.length === 1 ? '' : 's'} &middot; code {g.inviteCode}
                </Typography>
              </Box>
              <Chip label={STATUS_LABEL[g.status]} size="small" color={g.status === 'open' ? 'default' : 'primary'} />
            </Paper>
          ))}
        </Stack>
      )}
    </Container>
  );
}
