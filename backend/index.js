const express = require("express");
const parser = require("body-parser");
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Connect to PostgreSQL
const { Pool } = require("pg");
const pool = new Pool({
  user: "postgres",
  host: "postgres",
  database: "VgSLDB",
  password: "admin",
  port: 5432,
});

// Get all games and review count
app.get("/games", async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sort_by = "name",
    sort_order = "ASC",
  } = req.query;
  const offset = (page - 1) * limit;
  try {
    //do with ID
    const result = await pool.query(
      `
        SELECT s.*, COALESCE(r.review_count, 0) as review_count
        FROM sales s
        LEFT JOIN (
            SELECT app_id, COUNT(*) as review_count
            FROM reviews
            GROUP BY app_id
        ) r ON s.id = r.app_id;
        ORDER BY s.${sort_by} ${sort_order};
        LIMIT $1 OFFSET $2;
      `,
      [limit, offset]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Post game by id
app.post("/sales", async (req, res) => {
  const {
    rank,
    name,
    year,
    genre,
    publisher,
    na_sales,
    eu_sales,
    jp_sales,
    other_sales,
    global_sales,
  } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO sales (rank, name, year, genre, publisher, na_sales, eu_sales, jp_sales, other_sales, global_sales) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *",
      [
        rank,
        name,
        year,
        genre,
        publisher,
        na_sales,
        eu_sales,
        jp_sales,
        other_sales,
        global_sales,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Failed to insert into sales:", err);
    res.status(500).json({ error: err.message });
  }
});

// Update game by id
app.put("/sales/:id", async (req, res) => {
  const { id } = req.params;
  const {
    rank,
    name,
    year,
    genre,
    publisher,
    na_sales,
    eu_sales,
    jp_sales,
    other_sales,
    global_sales,
  } = req.body;
  try {
    const result = await pool.query(
      "UPDATE sales SET rank = $1, name = $2, year = $3, genre = $4, publisher = $5, na_sales = $6, eu_sales = $7, jp_sales = $8, other_sales = $9, global_sales = $10 WHERE id = $11 RETURNING *",
      [
        rank,
        name,
        year,
        genre,
        publisher,
        na_sales,
        eu_sales,
        jp_sales,
        other_sales,
        global_sales,
        id,
      ]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Game not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get reviews by game name
app.get("/reviews/:gameName", async (req, res) => {
  const { gameName } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const offset = (page - 1) * limit;
  try {
    const result = await pool.query(
      `SELECT * FROM (
        SELECT reviews.review_text, reviews.review_score, reviews.review_votes, reviews.id
        FROM reviews
        WHERE reviews.app_name = $1 AND reviews.review_score = 1
        ORDER BY reviews.review_votes DESC, reviews.review_text ASC
        LIMIT $2 OFFSET $3
      ) AS PositiveReviews
      UNION ALL
      SELECT * FROM (
        SELECT reviews.review_text, reviews.review_score, reviews.review_votes, reviews.id
        FROM reviews
        WHERE reviews.app_name = $2 AND reviews.review_score = -1
        ORDER BY reviews.review_votes DESC, reviews.review_text ASC
        LIMIT $2 OFFSET $3
      ) AS NegativeReviews`,
      [gameName, limit, offset, gameName, limit, offset]
    );
    if (result.rows.length > 0) {
      res.json(result.rows);
    } else {
      res.status(404).send({ message: "No reviews found for this game." });
    }
  } catch (err) {
    console.error("Failed to retrieve reviews:", err);
    res.status(500).send("Server error");
  }
});

// Add reviews by game name
app.post("/reviews", async (req, res) => {
  const { app_name, review_text, review_score, review_votes } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO reviews (app_name, review_text, review_score, review_votes) VALUES ($1, $2, $3, $4) RETURNING *",
      [app_name, review_text, review_score, review_votes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Failed to insert review:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete a review by id
app.delete("/reviews/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM reviews WHERE id = $1 RETURNING *;",
      [id]
    );
    if (result.rows.length > 0) {
      res.send({
        message: "Review deleted successfully",
        review: result.rows[0],
      });
    } else {
      res.status(404).json({ message: "Review not found" });
    }
  } catch (err) {
    console.error("Failed to delete review:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.sort("/games", async (req, res) => {
  const { sort_by = "name", sort_order = "ASC" } = req.query;
  try {
    const result = await pool.query(
      `SELECT * FROM sales ORDER BY ${sort_by} ${sort_order};`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Failed to retrieve games:", err);
    res.status(500).send("Server error");
  }
});

app.search("/games", async (req, res) => {
  const { search } = req.query;
  try {
    const result = await pool.query(
      `SELECT * FROM sales WHERE name ILIKE $1;`,
      [`%${search}%`]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Failed to search games:", err);
    res.status(500).send("Server error");
  }
});
