#Important! Must execute before working with database! Recommend naming the dataset files as specified in the code below.

import pandas as pd
import csv
import psycopg2
from io import StringIO
import logging

# Configure logging
logging.basicConfig(filename='import.log', level=logging.INFO, format='%(asctime)s:%(levelname)s:%(message)s')

def main():
    # Establish database connection
    conn = psycopg2.connect(dbname='VgSLDB', user='postgres', password='admin', host='localhost')
    cursor = conn.cursor()

    try:
        # Process and stream sales data
        logging.info('Processing sales data')
        process_and_load_chunks('datasets/vgsales.csv', 'sales', cursor, sales_cleaning)

        # Process and stream reviews data
        logging.info('Processing reviews data')
        process_and_load_chunks('datasets/dataset.csv', 'reviews', cursor, reviews_cleaning)

        # Commit all changes to the database
        conn.commit()
        logging.info('All data committed successfully')

    except Exception as e:
        # Roll back in case of an error
        conn.rollback()
        logging.error(f'Error during database operation: {e}', exc_info=True)

    finally:
        # Close database connections
        cursor.close()
        conn.close()
        logging.info('Database connection closed')

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

if __name__ == '__main__':
    main()