const { getRecommendationsForUser } = require('../utils/recommender');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/recommendations
const getMyRecommendations = asyncHandler(async (req, res) => {
  const recommendations = await getRecommendationsForUser(req.user);
  res.json(recommendations);
});

module.exports = { getMyRecommendations };
