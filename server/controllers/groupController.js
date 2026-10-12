const Group = require('../models/Group');
const Vote = require('../models/Vote');
const Movie = require('../models/Movie');
const User = require('../models/User');
const generateInviteCode = require('../utils/inviteCode');
const { getRecommendationsForUser } = require('../utils/recommender');
const asyncHandler = require('../utils/asyncHandler');

const isMember = (group, userId) => group.members.some((m) => String(m._id || m) === String(userId));

// POST /api/groups  { name }
const createGroup = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ message: 'Group name is required' });

  let inviteCode;
  for (let i = 0; i < 5; i++) {
    inviteCode = generateInviteCode();
    // eslint-disable-next-line no-await-in-loop
    if (!(await Group.findOne({ inviteCode }))) break;
  }

  const group = await Group.create({
    name: name.trim(),
    creator: req.user._id,
    members: [req.user._id],
    inviteCode,
  });
  res.status(201).json(group);
});

// POST /api/groups/join  { inviteCode }
const joinGroup = asyncHandler(async (req, res) => {
  const { inviteCode } = req.body;
  if (!inviteCode) return res.status(400).json({ message: 'inviteCode is required' });

  const group = await Group.findOne({ inviteCode: inviteCode.trim().toUpperCase() });
  if (!group) return res.status(404).json({ message: 'Invalid invite code' });
  if (isMember(group, req.user._id)) return res.status(409).json({ message: 'You are already in this group' });

  group.members.push(req.user._id);
  await group.save();
  res.json(group);
});

// GET /api/groups
const myGroups = asyncHandler(async (req, res) => {
  const groups = await Group.find({ members: req.user._id })
    .populate('members', 'name email')
    .sort({ createdAt: -1 });
  res.json(groups);
});

// GET /api/groups/:id
const getGroup = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id)
    .populate('members', 'name email')
    .populate('shortlist')
    .populate('winner');
  if (!group) return res.status(404).json({ message: 'Group not found' });
  if (!isMember(group, req.user._id)) return res.status(403).json({ message: 'You are not a member of this group' });
  res.json(group);
});

// Combines every member's individual rule-based scores into one ranked list (simple average).
const computeGroupRecommendations = async (group, limit = 8) => {
  const members = await User.find({ _id: { $in: group.members } });
  const perMemberLists = await Promise.all(members.map((m) => getRecommendationsForUser(m, { limit: 200 })));

  const totals = {};
  perMemberLists.forEach((list) => {
    list.forEach(({ _id, matchScore }) => {
      const key = String(_id);
      if (!totals[key]) totals[key] = { sum: 0 };
      totals[key].sum += matchScore;
    });
  });

  const movieIds = Object.keys(totals);
  const movies = await Movie.find({ _id: { $in: movieIds } });

  return movies
    .map((movie) => ({
      ...movie.toObject(),
      groupScore: Math.round((totals[String(movie._id)].sum / members.length) * 10) / 10,
    }))
    .sort((a, b) => b.groupScore - a.groupScore)
    .slice(0, limit);
};

// GET /api/groups/:id/recommendations
const getGroupRecommendations = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id);
  if (!group) return res.status(404).json({ message: 'Group not found' });
  if (!isMember(group, req.user._id)) return res.status(403).json({ message: 'You are not a member of this group' });

  res.json(await computeGroupRecommendations(group));
});

// POST /api/groups/:id/start-voting
const startVoting = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id);
  if (!group) return res.status(404).json({ message: 'Group not found' });
  if (String(group.creator) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Only the group creator can start voting' });
  }
  if (group.status !== 'open') {
    return res.status(400).json({ message: `Cannot start voting - this group is already "${group.status}"` });
  }
  if (group.members.length < 2) {
    return res.status(400).json({ message: 'Invite at least one more member before starting a vote' });
  }

  const recommendations = await computeGroupRecommendations(group, 5);
  if (recommendations.length === 0) {
    return res.status(400).json({ message: 'Not enough rated/preferred movies yet to build a shortlist' });
  }

  group.shortlist = recommendations.map((m) => m._id);
  group.status = 'voting';
  await group.save();
  res.json(group);
});

// POST /api/groups/:id/vote  { movieId }
const castVote = asyncHandler(async (req, res) => {
  const { movieId } = req.body;
  const group = await Group.findById(req.params.id);
  if (!group) return res.status(404).json({ message: 'Group not found' });
  if (!isMember(group, req.user._id)) return res.status(403).json({ message: 'You are not a member of this group' });
  if (group.status !== 'voting') return res.status(400).json({ message: 'Voting is not currently open for this group' });
  if (!group.shortlist.some((m) => String(m) === String(movieId))) {
    return res.status(400).json({ message: 'That movie is not on the shortlist' });
  }

  const vote = await Vote.findOneAndUpdate(
    { group: group._id, user: req.user._id },
    { movie: movieId },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  res.json(vote);
});

// POST /api/groups/:id/close
const closeVoting = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id);
  if (!group) return res.status(404).json({ message: 'Group not found' });
  if (String(group.creator) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Only the group creator can close voting' });
  }
  if (group.status !== 'voting') return res.status(400).json({ message: 'Voting is not currently open' });

  const votes = await Vote.find({ group: group._id });
  const counts = {};
  votes.forEach((v) => {
    const key = String(v.movie);
    counts[key] = (counts[key] || 0) + 1;
  });

  let maxVotes = -1;
  let tied = [];
  group.shortlist.forEach((movieId) => {
    const key = String(movieId);
    const c = counts[key] || 0;
    if (c > maxVotes) { maxVotes = c; tied = [key]; }
    else if (c === maxVotes) { tied.push(key); }
  });

  let winnerId = tied[0] || null;
  if (tied.length > 1) {
    // Tie-break: prefer whichever tied movie has the higher combined group recommendation score.
    const recs = await computeGroupRecommendations(group, group.shortlist.length);
    const byScore = recs.filter((r) => tied.includes(String(r._id))).sort((a, b) => b.groupScore - a.groupScore);
    winnerId = byScore[0]?._id || tied[0];
  }

  group.winner = winnerId;
  group.status = 'closed';
  await group.save();

  res.json({
    group,
    results: group.shortlist.map((movieId) => ({ movie: movieId, votes: counts[String(movieId)] || 0 })),
    tie: tied.length > 1,
  });
});

// GET /api/groups/:id/results
const getResults = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id)
    .populate('shortlist')
    .populate('winner')
    .populate('members', 'name');
  if (!group) return res.status(404).json({ message: 'Group not found' });
  if (!isMember(group, req.user._id)) return res.status(403).json({ message: 'You are not a member of this group' });

  const votes = await Vote.find({ group: group._id });
  const counts = {};
  votes.forEach((v) => {
    const key = String(v.movie);
    counts[key] = (counts[key] || 0) + 1;
  });

  res.json({
    group,
    results: group.shortlist.map((movie) => ({ movie, votes: counts[String(movie._id)] || 0 })),
  });
});

module.exports = {
  createGroup, joinGroup, myGroups, getGroup, getGroupRecommendations,
  startVoting, castVote, closeVoting, getResults,
};
