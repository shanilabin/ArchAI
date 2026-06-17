import sqlite3
import os

# נתיב מוחלט ל-archai.db ליד הקובץ הזה
DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "archai.db")


def get_connection():
    return sqlite3.connect(DB_FILE)


def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            original_drawing_url TEXT,
            scale_px_per_meter REAL,
            status TEXT NOT NULL DEFAULT 'draft',
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS project_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            item_code TEXT NOT NULL,
            description TEXT NOT NULL,
            unit TEXT NOT NULL,
            quantity REAL NOT NULL,
            unit_price REAL NOT NULL,
            FOREIGN KEY (project_id) REFERENCES projects(id)
        )
    """)
        # טבלת היסטוריית הדמיות (RenderHistory)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS render_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            materials_json TEXT,
            prompt TEXT,
            image_url TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (project_id) REFERENCES projects(id)
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS validation_issues (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            x REAL NOT NULL,
            y REAL NOT NULL,
            severity TEXT,
            description TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (project_id) REFERENCES projects(id)
        )
    """)

    conn.commit()
    conn.close()
    print("Database initialized successfully!")


if __name__ == "__main__":
    init_db()