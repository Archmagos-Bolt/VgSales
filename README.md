Requirements:
docker (used docker desktop but you can use what's convenient)

postgreSQL (used VsCode plugin)

express pb

node.js

react.js

antd

NPM 

axios

Modal

Instructions:
1. Place both datasets file into the folder named 'datasets'
2. Initialize docker and create database by running docker-compose --build and install all dependancies
3. Create database tables by running this script (db password is admin):
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

4. Run import-datasets.py to import data (might take a few minutes)
5. Add the game ID to sales table with this:
ALTER TABLE sales ADD COLUMN id SERIAL PRIMARY KEY;
ALTER TABLE reviews ADD COLUMN id SERIAL PRIMARY KEY;
Note: (Might be possible to do in step 3 but was unsure about how that would work with the import script so erring on the safe side recommend only running after the importation)
7. Run the backend and frontend by navigating to each and running npm start.

