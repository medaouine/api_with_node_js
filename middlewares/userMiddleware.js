const jwt = require('jsonwebtoken');
const pool = require('../db');

const isAuthenticated = async (req, res, next) => {
  
  const authHeader = req.headers['authorization'];
  console.log("======token=================", authHeader)
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, user) => {
    if (err) return res.sendStatus(403);

    req.user = user;
    next();
  });
};

module.exports = isAuthenticated;


