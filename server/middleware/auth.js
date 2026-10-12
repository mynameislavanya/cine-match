const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

// Verifies the JWT on the Authorization header and attaches req.user.
const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  const token = header.split(' ')[1];
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized, invalid token' });
  }

  const user = await User.findById(decoded.id).select('-passwordHash');
  if (!user) return res.status(401).json({ message: 'User no longer exists' });

  req.user = user;
  next();
});

module.exports = { protect };
