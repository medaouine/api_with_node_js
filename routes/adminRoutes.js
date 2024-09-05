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

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); 
  }
});

const upload = multer({ storage });







router.post('/addproduct', upload.single('image'), async (req, res) => {
  const { name, description, price, quantity } = req.body;
  const image = req.file ? `/images/${req.file.filename}` : null;

  try {
    const result = await pool.query(
      'INSERT INTO products (name, description, price, image, quantity) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, description, price, image, quantity]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error creating product');
  }
});




router.get('/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching products');
  }
});


router.put('/products/:id', upload.single('image'), async (req, res) => {
  const { id } = req.params;
  const { name, description, price, quantity } = req.body;
  const image = req.file ? `/images/${req.file.filename}` : null;

  try {
    const result = await pool.query(
      'UPDATE products SET name = $1, description = $2, price = $3, image = $4, quantity = $5 WHERE id = $6 RETURNING *',
      [name, description, price, image, quantity, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).send('Product not found');
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error updating product');
  }
});





router.get('/products/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).send('Product not found');
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching product');
  }
});













router.delete('/products/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).send('Product not found');
    }

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).send('Error deleting product');
  }
});

module.exports = router;
