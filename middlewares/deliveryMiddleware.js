
const isDelivery = (req, res, next) => {
  if (req.user.role !== 'delivery') return res.sendStatus(403);
  next();
};

module.exports = isDelivery;
