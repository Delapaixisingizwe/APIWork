require('dotenv').config(); // Load .env at the top

const express = require('express');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const port = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY;

app.use(express.json());

// ✅ MySQL connection using .env variables
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

connection.connect((err) => {
  if (err) {
    console.error('Database connection error:', err);
    process.exit(1);
  }
  console.log('Connected to the Clever Cloud MySQL database.');
});

// ✅ JWT Middleware (improved error handling)
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ message: 'Authorization header missing' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Token missing from header' });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      console.error('JWT error:', err.message);
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    req.user = user;
    next();
  });
}

// ✅ User Signup
app.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const query = 'INSERT INTO users (email, password) VALUES (?, ?)';

  connection.query(query, [email, hashedPassword], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('User registration failed');
    }
    res.status(201).send('User registered successfully');
  });
});

// ✅ User Login
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  const query = 'SELECT * FROM users WHERE email = ?';
  connection.query(query, [email], async (err, results) => {
    if (err || results.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      SECRET_KEY,
      { expiresIn: '1h' } // Increase this if needed (e.g., '6h', '12h', '7d')
    );
    

    res.json({ token });
  });
});

// ✅ Get All Products (Protected)
app.get('/products', authenticateToken, (req, res) => {
  connection.query('SELECT * FROM products', (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Failed to retrieve products');
    }
    res.json(results);
  });
});

// ✅ Add Product (Protected)
app.post('/products', authenticateToken, (req, res) => {
  const { product_name, description, price, stock } = req.body;

  if (!product_name || !description || price == null || stock == null) {
    return res.status(400).send('All fields are required');
  }

  const query = `
    INSERT INTO products (product_name, description, price, stock, created_at)
    VALUES (?, ?, ?, ?, NOW())
  `;

  connection.query(query, [product_name, description, price, stock], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Failed to add product');
    }

    res.status(201).json({
      message: 'Product added successfully',
      productId: results.insertId
    });
  });
});

// ✅ Update Product (PUT)
app.put('/products/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { product_name, description, price, stock } = req.body;

  if (!product_name || !description || price == null || stock == null) {
    return res.status(400).send('All fields are required');
  }

  const query = `
    UPDATE products
    SET product_name = ?, description = ?, price = ?, stock = ?
    WHERE id = ?
  `;

  connection.query(query, [product_name, description, price, stock, id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Failed to update product');
    }

    if (results.affectedRows === 0) {
      return res.status(404).send('Product not found');
    }

    res.status(200).json({ message: 'Product updated successfully' });
  });
});

// ✅ Delete Product (DELETE)
app.delete('/products/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  const query = 'DELETE FROM products WHERE id = ?';

  connection.query(query, [id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Failed to delete product');
    }

    if (results.affectedRows === 0) {
      return res.status(404).send('Product not found');
    }

    res.status(200).json({ message: 'Product deleted successfully' });
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
