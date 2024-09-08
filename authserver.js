require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors'); 
const bcrypt = require('bcrypt');
const pool = require('./db'); 
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const app = express();

app.use(cors({
  origin: 'http://localhost:5173', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'], 
  credentials: true 
}));



app.use(express.json());

app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
   
    const existingUserResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUserResult.rows.length > 0) {
      return res.status(400).json({ message: 'Email already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

  
    const result = await pool.query('INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role', [name, email, hashedPassword, 'user']);
    
    const { id, name: userName, email: userEmail, role } = result.rows[0];

   
    const accessToken = jwt.sign({ id, role }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "5m" });
    const refreshToken = jwt.sign({ id, role }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '2h' }); 

   
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); 

 
    await pool.query('INSERT INTO tokens (user_id, access_token, refresh_token, expires_at) VALUES ($1, $2, $3, $4)', [id, accessToken, refreshToken, expiresAt]);

    
    res.status(201).json({ 
      accessToken: accessToken, 
      refreshToken: refreshToken, 
      user: { id, name: userName, email: userEmail, role } 
    });
  } catch (error) {
    console.error('Error registering user:', error.message);
    res.status(500).json({ message: 'Error registering user' });
  }
});

app.post('/registeradmin', async (req, res) => {
  const { name, email, password } = req.body;
  try {
 
    const existingUserResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUserResult.rows.length > 0) {
      return res.status(400).json({ message: 'Email already taken' });
    }

  
    const hashedPassword = await bcrypt.hash(password, 10);

  
    const result = await pool.query('INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, role', [name, email, hashedPassword, 'admin']);
    const { id, role } = result.rows[0];

   
    const accessToken = jwt.sign({ id, role }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '10h' });
    const refreshToken = jwt.sign({ id, role }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '24h' }); // 

 
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); 

  
    await pool.query('INSERT INTO tokens (user_id, access_token, refresh_token, expires_at) VALUES ($1, $2, $3, $4)', [id, accessToken, refreshToken, expiresAt]);


    res.status(201).json({ accessToken, refreshToken });
  } catch (error) {
    console.error('Error registering admin:', error.message);
    res.status(500).json({ message: 'Error registering admin' });
  }
});


app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
   
    const result = await pool.query('SELECT id, name, email, password, role FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'User not found. Please check your email.' });
    }

    const { id, name, email: userEmail, password: hashedPassword, role } = result.rows[0];
    
    
    const isMatch = await bcrypt.compare(password, hashedPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password. Please try again.' });
    }

  
    const accessToken = jwt.sign({ id, role }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "5m" });
    const refreshToken = jwt.sign({ id, role }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "4h" }); 
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); 
    
    await pool.query('INSERT INTO tokens (user_id, access_token, refresh_token, expires_at) VALUES ($1, $2, $3, $4)', [id, accessToken, refreshToken, expiresAt]);

   
    res.status(200).json({ 
      accessToken: accessToken, 
      refreshToken: refreshToken, 
      user: { id, name, email: userEmail, role } 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
});

app.delete('/logout', async (req, res) => {

 const { token } = req.body;
 //const token = req.headers['authorization']?.split(' ')[1];
  //if (!token) return res.status(401).send('Unauthorized');

  console.log ("token received from front end " ,token )
  if (!token) return res.sendStatus(401);

  try {
    const tokenResult = await pool.query('SELECT user_id FROM tokens WHERE refresh_token = $1', [token]);

    console.log ("tokenResult checked from database " ,tokenResult )
    if (tokenResult.rows.length === 0) return res.sendStatus(401); 
    const userId = tokenResult.rows[0].user_id;

    console.log ("userId  " ,userId  )


    const userResult = await pool.query('SELECT name FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) return res.sendStatus(404); 




    const username = userResult.rows[0].name;
    await pool.query('DELETE FROM tokens WHERE refresh_token = $1', [token]);


    console.log (`${username} has been logged out successfully`  );

    res.status(200).json({ message: `success` });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error logging out');
  }
});




app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const result = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(404).send('User not found');

    const userId = result.rows[0].id;

    const resetToken = crypto.randomBytes(20).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); 
    await pool.query('INSERT INTO password_reset_tokens (user_id, reset_token, expires_at) VALUES ($1, $2, $3)', [userId, resetToken, expiresAt]);





    const resetLink = `http://localhost:5173/resetpassword?token=${resetToken}`;
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset',
      text: `You requested a password reset. Click the following link to reset your password: ${resetLink}`
    };
    
    await transporter.sendMail(mailOptions);
    res.status(200).send('Password reset email sent');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error processing password reset');
  }
});


app.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const result = await pool.query('SELECT * FROM password_reset_tokens WHERE reset_token = $1', [token]);
    if (result.rows.length === 0) return res.status(400).send('Invalid or expired token');

    const { user_id, expires_at } = result.rows[0];
    if (new Date() > new Date(expires_at)) return res.status(400).send('Token expired');

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, user_id]);
    await pool.query('DELETE FROM password_reset_tokens WHERE reset_token = $1', [token]);

    res.status(200).send('Password has been reset');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error resetting password');
  }
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  secure:true,
  auth: {



    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
   
  }
});


app.post('/token', async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken == null) return res.sendStatus(401); 

  try {
  
    const result = await pool.query('SELECT * FROM tokens WHERE refresh_token = $1', [refreshToken]);
    if (result.rows.length === 0) return res.sendStatus(403); 

    const { expires_at } = result.rows[0];
    if (new Date() > new Date(expires_at)) {
  
      return res.status(403).send('Refresh token expired'); 
    }


    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
    
          return res.status(403).send('Refresh token expired'); 
        }
        return res.sendStatus(403); 
      }

     
      const accessToken = jwt.sign({ id: user.id, role: user.role }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: 40 });
      res.status(201).json({ accessToken });
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error processing token'); 
  }
});


const cleanExpiredTokens = async () => {
  try {
    const result = await pool.query('DELETE FROM tokens WHERE expires_at < NOW()');
    console.log(`Expired tokens cleaned up: ${result.rowCount} tokens deleted.`);
  } catch (error) {
    console.error('Error cleaning expired tokens:', error);
  }
};


setInterval(cleanExpiredTokens, 60 * 60 * 1000); 

app.listen(process.env.AUTH_SERVER_PORT, () => {
  console.log(`Auth server running on port ${process.env.AUTH_SERVER_PORT}`);
});
