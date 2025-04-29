const express = require('express');
const mysql = require('mysql2');

const app = express();
const port = 3000;

// Middleware to parse JSON
app.use(express.json());

// MySQL database connection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'ecommerce_system'
});

// Connect to database
connection.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err.stack);
    return;
  }
  console.log('Connected to the ecommerce_system database.');
});

// ✅ GET all products
app.get('/products', (req, res) => {
  const query = 'SELECT * FROM products';
  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching products:', err);
      res.status(500).send('Failed to retrieve products');
    } else {
      res.json(results);
    }
  });
});

// ✅ POST - Add a new product
app.post('/products', (req, res) => {
  const { product_name, description, price, stock } = req.body;

  if (!product_name || !description || !price || !stock) {
    return res.status(400).send('All fields are required: product_name, description, price, stock');
  }

  const query = `
    INSERT INTO products (product_name, description, price, stock, created_at)
    VALUES (?, ?, ?, ?, NOW())
  `;

  connection.query(query, [product_name, description, price, stock], (err, results) => {
    if (err) {
      console.error('Error inserting product:', err);
      res.status(500).send('Failed to add product');
    } else {
      res.status(201).json({ message: 'Product added successfully', productId: results.insertId });
    }
  });
});

// ✅ PUT - Update a product by ID
app.put('/products/:id', (req, res) => {
  if (!req.body) return res.status(400).send('Request body is missing.');

  const { product_name, description, price, stock } = req.body;

  if (!product_name || !description || !price || !stock) {
    return res.status(400).send('All fields are required: product_name, description, price, stock');
  }

  const productId = req.params.id;
  const query = `
    UPDATE products
    SET product_name = ?, description = ?, price = ?, stock = ?
    WHERE product_id = ?
  `;

  connection.query(query, [product_name, description, price, stock, productId], (err, results) => {
    if (err) {
      console.error('Error updating product:', err);
      res.status(500).send('Failed to update product');
    } else if (results.affectedRows === 0) {
      res.status(404).send('Product not found');
    } else {
      res.send('Product updated successfully');
    }
  });
});

// ✅ PATCH - Partially update a product by ID
app.patch('/products/:id', (req, res) => {
  const productId = req.params.id;
  const fields = req.body;

  const keys = Object.keys(fields);
  if (keys.length === 0) {
    return res.status(400).send('At least one field must be provided for update');
  }

  const setClause = keys.map(key => `${key} = ?`).join(', ');
  const values = keys.map(key => fields[key]);

  const query = `UPDATE products SET ${setClause} WHERE product_id = ?`;

  connection.query(query, [...values, productId], (err, results) => {
    if (err) {
      console.error('Error partially updating product:', err);
      res.status(500).send('Failed to update product');
    } else if (results.affectedRows === 0) {
      res.status(404).send('Product not found');
    } else {
      res.send('Product updated successfully (partial)');
    }
  });
});

// ✅ HEAD - Check if a product exists by ID
app.head('/products/:id', (req, res) => {
  const productId = req.params.id;
  const query = 'SELECT 1 FROM products WHERE product_id = ? LIMIT 1';

  connection.query(query, [productId], (err, results) => {
    if (err) {
      console.error('Error checking product:', err);
      return res.sendStatus(500);
    }

    if (results.length === 0) {
      return res.sendStatus(404);
    }

    return res.sendStatus(200);
  });
});

// ✅ OPTIONS - Get allowed methods for a product by ID
app.options('/products/:id', (req, res) => {
  res.setHeader('Allow', 'GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS');
  res.sendStatus(200);
});

// ✅ DELETE - Remove a product by ID
app.delete('/products/:id', (req, res) => {
  const productId = req.params.id;
  const query = 'DELETE FROM products WHERE product_id = ?';

  connection.query(query, [productId], (err, results) => {
    if (err) {
      console.error('Error deleting product:', err);
      res.status(500).send('Failed to delete product');
    } else if (results.affectedRows === 0) {
      res.status(404).send('Product not found');
    } else {
      res.send('Product deleted successfully');
    }
  });
});

// ✅ Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
