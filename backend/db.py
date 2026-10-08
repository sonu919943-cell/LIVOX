import os
from pathlib import Path
import mysql.connector
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)


def get_db_connection():
    try:
        conn = mysql.connector.connect(
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", "3306")),
            user=os.getenv("DB_USER", "root"),
            password=os.getenv("DB_PASSWORD", ""),
            database=os.getenv("DB_NAME", "livox"),
        )

        print("MySQL connected successfully!")
        return conn

    except mysql.connector.Error as err:
        print(f"Database connection error: {err}")
        return None