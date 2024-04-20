const express = require('express');
const parser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;


app.use(express.json());

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Connect to PostgreSQL
const { Pool } = require('pg');
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'VgSLDB',
  password: 'admin',
  port: 5432,
});

// Get all games and review count
app.get('/games', async (req, res) => {
  try {
      const result = await pool.query(`
        SELECT s.*, COALESCE(r.review_count, 0) as review_count
        FROM sales s
        LEFT JOIN (
            SELECT app_name, COUNT(*) as review_count
            FROM reviews
            GROUP BY app_name
        ) r ON s.name = r.app_name;
      `);
      res.json(result.rows);
  } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
  }
});

// Post game by id
app.post('/games', async (req, res) => {
  const { name, platform, year, genre, publisher } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO games (name, platform, year, genre, publisher) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, platform, year, genre, publisher]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update game by id
app.put('/games/:id', async (req, res) => {
  const { id } = req.params;
  const { name, platform, year, genre, publisher } = req.body;
  try {
    const result = await pool.query(
      'UPDATE games SET name = $1, platform = $2, year = $3, genre = $4, publisher = $5 WHERE id = $6 RETURNING *',
      [name, platform, year, genre, publisher, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Game not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/reviews', async (req, res) => {
  try {
    const result = await pool.query(
      `Select sales.*, reviews.review_text, reviews.review_score, reviews.review_votes 
      FROM sales 
      LEFT JOIN reviews ON sales.name = reviews.app_name
      WHERE sales.name = $1;`, [gameName]
    )
  }
  catch (err) {
    res.status(500).json({ error: err.message });
  }
});