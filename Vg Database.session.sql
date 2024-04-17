CREATE TABLE IF NOT EXISTS sales(
    Rank INT,
    Name TEXT,
    Platform TEXT,
    Year INT,
    Genre TEXT,
    Publisher TEXT,
    NA_Sales REAL,
    EU_Sales REAL,
    JP_Sales REAL,
    Other_Sales REAL,
    Global_Sales REAL
);

CREATE TABLE IF NOT EXISTS reviews(
    app_id INT,
    app_name TEXT,
    review_text TEXT,
    review_score REAL,
    review_votes INT
);

