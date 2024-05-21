import pandas as pd
import csv
import psycopg2
from io import StringIO
import logging
import random

# Configure logging
logging.basicConfig(filename='import.log', level=logging.INFO, format='%(asctime)s:%(levelname)s:%(message)s')

def create_db_tables(cursor):
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sales (
            rank INT NULL,
            name TEXT,
            year INT,
            genre TEXT,
            publisher TEXT,
            na_sales FLOAT,
            eu_sales FLOAT,
            jp_sales FLOAT,
            other_sales FLOAT,
            global_sales FLOAT,
            id SERIAL PRIMARY KEY
        );
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS reviews (
            id SERIAL PRIMARY KEY,
            app_id BIGINT,
            app_name TEXT,
            review_text TEXT,
            review_score INT,
            review_votes INT,
            FOREIGN KEY (app_id) REFERENCES sales (id)
        );
    """)

def insert_sales_record(cursor, record):
    try:
        cursor.execute("""
            INSERT INTO sales (rank, name, year, genre, publisher, na_sales, eu_sales, jp_sales, other_sales, global_sales)
            VALUES (NULL, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
        """, (
            record['Name'], record['Year'], record['Genre'], record['Publisher'],
            record['NA_Sales'], record['EU_Sales'], record['JP_Sales'], record['Other_Sales'], record['Global_Sales']
        ))
        sales_id = cursor.fetchone()[0]
        logging.info(f'Inserted sales record with ID: {sales_id}')
        return sales_id
    except Exception as e:
        logging.error(f'Error inserting sales record: {e}', exc_info=True)
        return None

def insert_review_record(cursor, review):
    try:
        cursor.execute("""
            INSERT INTO reviews (app_id, app_name, review_text, review_score, review_votes)
            VALUES (%s, %s, %s, %s, %s)
        """, review)
        logging.info(f'Inserted review for app_id: {review[0]}')
    except Exception as e:
        logging.error(f'Error inserting review record: {e}', exc_info=True)

def process_and_load_sales_and_reviews(sales_filepath, reviews_filepath, cursor, sales_cleaning, reviews_cleaning):
    try:
        # Read and index all sales by game name
        sales_data=[]
        with open(sales_filepath, 'r', newline='', encoding='utf-8') as salesfile:
            sales_reader = csv.DictReader(salesfile, quoting=csv.QUOTE_ALL)
            for sales_record in sales_reader:
                sales_data.append(sales_record)

        # Convert to DataFrame and clean the data
        sales_df = pd.DataFrame(sales_data)
        sales_df = sales_cleaning(sales_df)

        sales_id_map={}
        for _, sales_record in sales_df.iterrows():
            sales_record = sales_record.to_dict()
            sales_id = insert_sales_record(cursor, sales_record)
            if sales_id:
                sales_id_map[sales_record['Name']] = sales_id
                    
        with open(reviews_filepath, 'r', newline='', encoding='utf-8') as reviewsfile:
            reviews_reader = csv.DictReader(reviewsfile, quoting=csv.QUOTE_ALL)
            for review_record in reviews_reader:
                app_name = review_record['app_name'].strip()
                if app_name in sales_id_map:
                    sales_id = sales_id_map[app_name]
                    review_df = pd.DataFrame([review_record])
                    review_df = reviews_cleaning(review_df)
                    if not review_df.empty:
                        review_record = review_df.iloc[0].to_dict()
                        cleaned_review =(
                            sales_id, review_record['app_name'], review_record['review_text'],
                            review_record['review_score'], review_record['review_votes']
                        )
                        insert_review_record(cursor, cleaned_review)
                    
    except Exception as e:
        logging.error(f'Error processing sales and reviews data: {e}', exc_info=True)


def sales_cleaning(df):
    try:
        logging.info('Starting sales data cleaning')

        df['Name'] = df['Name'].str.strip().replace('"', '')
        df['Genre'] = df['Genre'].str.strip()
        df['Publisher'] = df['Publisher'].str.strip()
        df['Year'] = pd.to_numeric(df['Year'], errors='coerce').fillna(0).astype(int)
        
        sales_columns = ['NA_Sales', 'EU_Sales', 'JP_Sales', 'Other_Sales', 'Global_Sales']
        for col in sales_columns:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

        # Group by Name, Year, Genre, and Publisher to sum the sales
        df = df.groupby(['Name', 'Year', 'Genre', 'Publisher'], as_index=False).agg({
            'NA_Sales': 'sum',
            'EU_Sales': 'sum',
            'JP_Sales': 'sum',
            'Other_Sales': 'sum',
            'Global_Sales': 'sum'
        })


        return df
    except Exception as e:
        logging.error(f'Error cleaning sales data: {e}', exc_info=True)
        return pd.DataFrame()

def reviews_cleaning(df):
    df['review_text'] = df['review_text'].astype(str).replace("'", "''", regex=True)
    df = df[~df['review_text'].isin(["Early Access Review", "", "."])]
    df['app_name']=df['app_name'].str.strip()
    return df

def main():
    conn = psycopg2.connect(dbname='VgSLDB', user='postgres', password='admin', host='postgres', port='5432')
    cursor = conn.cursor()
    try:
        create_db_tables(cursor)

        logging.info('Processing sales and reviews data')
        process_and_load_sales_and_reviews('/app/datasets/vgsales.csv', '/app/datasets/dataset.csv', cursor, sales_cleaning, reviews_cleaning)

        conn.commit()
        logging.info('All data committed successfully')

    except Exception as e:
        conn.rollback()
        logging.error(f'Error during database operation: {e}', exc_info=True)

    finally:
        cursor.close()
        conn.close()
        logging.info('Database connection closed')

    with open('/data/imported.txt', 'w') as f:
        f.write('Data has been imported')

if __name__ == '__main__':
    main()