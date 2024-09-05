const express = require('express');
const router = express.Router();
const pool = require('../db'); 
const multer = require('multer');
const path = require('path'); 


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/images'));
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
        image: product.image ? `/images/${path.basename(product.image)}` : null 
      }));
      res.json(products);
    } catch (error) {
      console.error(error);
      res.status(500).send('Error fetching products');
    }
  });









module.exports = router;










