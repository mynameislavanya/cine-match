// Wraps an async controller so thrown errors/rejected promises reach the error handler
// instead of crashing the process (Express 4 does not catch these automatically).
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
