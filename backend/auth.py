import sqlite3
import jwt
import datetime
import os
from dotenv import load_dotenv
from passlib.context import CryptContext
from fastapi import HTTPException, status
from database import get_connection

# טעינת משתני סביבה מקובץ .env
load_dotenv()

# הגדרות הצפנה
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("JWT_SECRET")
if not SECRET_KEY:
    raise ValueError("❌ ERROR: JWT_SECRET must be set in .env file")
ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(username: str):
    payload = {
        "sub": username,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24),  # תוקף 24 שעות
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def register_user(username: str, password: str):
    hashed = hash_password(password)
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO users (username, password) VALUES (?, ?)", (username, hashed))
        conn.commit()
        return {"message": "User registered successfully!"}
    except sqlite3.IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists",
        )
    finally:
        conn.close()


def login_user(username: str, password: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT password FROM users WHERE username = ?", (username,))
    row = cursor.fetchone()
    conn.close()

    if not row or not verify_password(password, row[0]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    token = create_access_token(username)
    return {"token": token, "username": username}


def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
        user_row = cursor.fetchone()
        conn.close()

        if user_row:
            return {"id": user_row[0], "username": username}
        return None
    except jwt.InvalidTokenError:
        return None
