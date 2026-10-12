const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const asyncHandler = require('../utils/asyncHandler');

const publicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  favouriteGenres: user.favouriteGenres,
  favouriteLanguages: user.favouriteLanguages,
});

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }

  const passwordErrors = [];

  if (password.length < 8) {
    passwordErrors.push('at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    passwordErrors.push('at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    passwordErrors.push('at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    passwordErrors.push('at least one number');
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    passwordErrors.push('at least one special character');
  }

  if (passwordErrors.length > 0) {
    return res.status(400).json({
      message: `Password must contain ${passwordErrors.join(', ')}.`,
    });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return res.status(409).json({ message: 'An account with this email already exists' });

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({ name, email, passwordHash });

  res.status(201).json({ ...publicUser(user), token: generateToken(user._id) });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  res.json({ ...publicUser(user), token: generateToken(user._id) });
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  res.json(publicUser(req.user));
});

// PUT /api/auth/preferences
const updatePreferences = asyncHandler(async (req, res) => {
  const { favouriteGenres, favouriteLanguages } = req.body;
  if (favouriteGenres) req.user.favouriteGenres = favouriteGenres;
  if (favouriteLanguages) req.user.favouriteLanguages = favouriteLanguages;
  await req.user.save();
  res.json(publicUser(req.user));
});

module.exports = { register, login, getMe, updatePreferences };
