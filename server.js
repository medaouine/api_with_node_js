require('dotenv').config();
const express = require('express');
const pool = require('./db'); 
const cors = require('cors'); 
const isAuthenticated = require('./middlewares/userMiddleware');
const isAdmin = require('./middlewares/adminMiddleware');
const isDelivery = require('./middlewares/deliveryMiddleware');


const path = require('path'); 







const app = express();

app.use(cors({
  origin: 'http://localhost:5173', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'], 
  credentials: true 
}));


app.use(express.json());   


app.use('/images', express.static(path.join(__dirname, 'public/images')));
const publicRoutes = require('./routes/publicRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');



app.use('/public', publicRoutes); // http://localhost:3000/images/juice.jpg
app.use('/users', isAuthenticated, userRoutes);
app.use('/admins', isAuthenticated, isAdmin, adminRoutes);
app.use('/delivery', isAuthenticated, isDelivery, deliveryRoutes);

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
