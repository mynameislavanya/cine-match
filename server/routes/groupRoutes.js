const express = require('express');
const { protect } = require('../middleware/auth');
const {
  createGroup, joinGroup, myGroups, getGroup, getGroupRecommendations,
  startVoting, castVote, closeVoting, getResults,
} = require('../controllers/groupController');

const router = express.Router();
router.use(protect);

router.post('/', createGroup);
router.post('/join', joinGroup);
router.get('/', myGroups);
router.get('/:id', getGroup);
router.get('/:id/recommendations', getGroupRecommendations);
router.post('/:id/start-voting', startVoting);
router.post('/:id/vote', castVote);
router.post('/:id/close', closeVoting);
router.get('/:id/results', getResults);

module.exports = router;
