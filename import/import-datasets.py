#Important! Must execute before working with database! Recommend naming the dataset files as specified in the code below.

import pandas as pd
import csv
import psycopg2
from io import StringIO
import logging
import os

# Configure logging
logging.basicConfig(filename='import.log', level=logging.INFO, format='%(asctime)s:%(levelname)s:%(message)s')

def create_db_tables(cursor):
    # Creating sales table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sales (
            name TEXT,
            platform TEXT,
            year INT,
            genre TEXT,
            publisher TEXT,
            na_sales FLOAT,
            eu_sales FLOAT,
            jp_sales FLOAT,
            other_sales FLOAT,
            global_sales FLOAT
        );
    """)
    # Creating reviews table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS reviews (
            app_name TEXT,
            review_text TEXT,
            review_score INT,
            review_votes INT
        );
    """)

def process_and_load_chunks(filepath, table_name, cursor, cleaning_function, chunksize=50000):
    # Read and process CSV in chunks
    for chunk in pd.read_csv(filepath, chunksize=chunksize):
        cleaned_chunk = cleaning_function(chunk)
        if not cleaned_chunk.empty:
            stream_to_postgres(cleaned_chunk, table_name, cursor)

def sales_cleaning(df):
    # Clean and filter sales data
    df.fillna({'Year': 0}, inplace=True)
    df['Year'] = df['Year'].astype(int)
    return df

def reviews_cleaning(df):
    # Clean and filter reviews data
    df['review_text'] = df['review_text'].astype(str).replace("'", "''", regex=True)
    df = df[df['app_id'] >= 10]  # Ensure processing starts from app_id 10
    df = df[~df['review_text'].isin(["Early Access Review", "", "."])]
    return df

def stream_to_postgres(df, table_name, cursor):
    # Stream DataFrame to PostgreSQL using COPY with explicit CSV formatting
    buffer = StringIO()
    df.to_csv(buffer, index=False, header=False, quoting=csv.QUOTE_NONNUMERIC)  # Ensure non-numeric fields are quoted
    buffer.seek(0)
    cursor.copy_expert(f"COPY {table_name} FROM STDIN WITH (FORMAT csv, HEADER false, DELIMITER ',', QUOTE '\"')", buffer)  # Detailed copy specifications
    
def create_table_id(cursor):
    cursor.execute("""
        ALTER TABLE sales ADD COLUMN id SERIAL PRIMARY KEY;
    """)
    cursor.execute("""
        ALTER TABLE reviews ADD COLUMN id SERIAL PRIMARY KEY;
    """
    )

def main():
    # Establish database connection
    conn = psycopg2.connect(dbname='VgSLDB', user='postgres', password='admin', host='postgres', port='5432')
    cursor = conn.cursor()
    try:
        # Check if the import process should be skipped
        if os.environ.get("RUN_IMPORT") != "true":
            print("Skipping import")
            exit()
        if os.path.exists('/data/imported.txt'):
            print('Data has already been imported. Exiting...')
            exit()
        
        create_db_tables(cursor)
        # Process and stream sales data
        logging.info('Processing sales data')
        process_and_load_chunks('/datasets/vgsales.csv', 'sales', cursor, sales_cleaning)

        # Process and stream reviews data
        logging.info('Processing reviews data')
        process_and_load_chunks('/datasets/dataset.csv', 'reviews', cursor, reviews_cleaning)

        # Commit all changes to the database
        conn.commit()
        logging.info('All data committed successfully')
        
        create_table_id(cursor)
        conn.commit()
        logging.info('All data committed successfully and serial ID added to tables.')

    except Exception as e:
        # Roll back in case of an error
        conn.rollback()
        logging.error(f'Error during database operation: {e}', exc_info=True)

    finally:
        # Close database connections
        cursor.close()
        conn.close()
        logging.info('Database connection closed')

    # Write a file to indicate that the data has been imported
    with open('/data/imported.txt', 'w') as f:
        f.write('Data has been imported')
        
if __name__ == '__main__':
    main()