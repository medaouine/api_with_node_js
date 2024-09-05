const jwt = require('jsonwebtoken');

function isImagesAllowed(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).send('Unauthorized');

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.status(403).send('Forbidden');

    req.user = user;

    if (['user', 'delivery', 'admin'].includes(user.role)) {
      next();
    } else {
      res.status(403).send('Forbidden');
    }
  });
}

module.exports = { isImagesAllowed }; 













