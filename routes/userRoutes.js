const express = require('express');
const router = express.Router();
const pool = require('../db'); 
const multer = require('multer');



router.get('/profile', async (req, res) => {
  try {
    const userId = req.user.id; 
    const result = await pool.query('SELECT id, email, role FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) return res.status(404).send('User not found');
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error retrieving profile');
  }
});




const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../assets/images'));
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); 
  }
});

const upload = multer({ storage });

router.get('/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products');
    const products = result.rows.map(product => ({
      ...product,
      image: product.image ? `/admin/images/${path.basename(product.image)}` : null 
    }));
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching products');
  }
});

module.exports = router;


