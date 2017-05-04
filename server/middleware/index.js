// require a login
const requiresLogin = (req, res, next) => {
  if (!req.session.account) {
    return res.status(401).json({ error: 'Login required' });
  }
  return next();
};

// require a logout
const requiresLogout = (req, res, next) => {
  if (req.session.account) {
    return res.status(401).json({ error: 'Logout required' });
  }
  return next();
};

// require a secure connection
const requiresSecure = (req, res, next) => {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(`https://${req.hostname}${req.url}`);
  }
  return next();
};

// remove the secure connection if local
const bypassSecure = (req, res, next) => {
  next();
};

module.exports.requiresLogin = requiresLogin;
module.exports.requiresLogout = requiresLogout;

if (process.env.NODE_ENV === 'production') {
  module.exports.requiresSecure = requiresSecure;
} else {
  module.exports.requiresSecure = bypassSecure;
}
