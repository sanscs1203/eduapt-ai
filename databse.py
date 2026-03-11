import sqlite3

DB_NAME = 'eduapt.db'

def get_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    # Create students table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT  NOT NULL,
            level TEXT NOT NULL,
            preferred_material TEXT NOT NULL,
            available_time TEXT NOT NULL
        )
    ''')
    
    # Create resources table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS resources (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            theme TEXT NOT NULL,
            type TEXT NOT NULL,
            title TEXT NOT NULL,
            url TEXT NOT NULL,
            difficulty TEXT NOT NULL,
            duration_min INTEGER NOT NULL,
            description TEXT NOT NULL
        )
    ''')
    
    # Create sesiones table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sesiones (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            resource_id INTEGER NOT NULL,
            feedback TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            course_id INTEGER,
            FOREIGN KEY (student_id) REFERENCES students(id),
            FOREIGN KEY (resource_id) REFERENCES resources(id)
        )
    ''')
    
    conn.commit()
    conn.close()
    
if __name__ == '__main__':
    init_db()
    print("Database initialized successfully.")