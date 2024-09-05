const express = require('express');
const router = express.Router();

router.get('/orders', async (req, res) => {

  res.send('Orders for delivery');
});

module.exports = router;
