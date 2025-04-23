// Placeholder for actual authentication (outside of the scope of this project)
const users = {
    alice: { token: 'abc123' },
    bob: { token: 'def456' }
};

// Simply checks if token matches the hardcoded one
module.exports = function authenticate(req, res, next) {
  const token = req.headers['x-auth-token'];

  if (!token) return res.status(401).json({ error: 'Missing auth token' });

  // Simple token-to-user match
  const user = Object.entries(users).find(([_, u]) => u.token === token);
  if (!user) return res.status(403).json({ error: 'Invalid token' });

  // Attach user info to the request object
  req.user = { name: user[0], token: token };
  next();
};