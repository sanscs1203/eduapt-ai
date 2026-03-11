import csv
import sqlite3
from database import DB_NAME, get_connection

def load_resources_from_csv(csv_file):
    with open(csv_file, newline='', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        
        conn = get_connection()
        cursor = conn.cursor()
            
        for row in reader:
            
            cursor.execute('SELECT COUNT(*) FROM resources WHERE url = ?', (row['url'],))
            count = cursor.fetchone()[0]
            
            if count == 0:
                cursor.execute('''
                    INSERT INTO resources (theme, type, title, url, difficulty, duration_min, description)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (
                    row['theme'],
                    row['type'],
                    row['title'],
                    row['url'],
                    row['difficulty'],
                    int(row['duration_min']),
                    row['description']
                ))

        conn.commit()
        conn.close()

if __name__ == '__main__':
    load_resources_from_csv('resources.csv')
    print("Resources loaded successfully from CSV.")