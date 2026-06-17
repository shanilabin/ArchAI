from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from dotenv import load_dotenv

from config import UPLOAD_DIR
from routers import auth_routes, projects

load_dotenv()
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# הגשת הקבצים שהועלו
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# חיבור הראוטרים (השכבות)
app.include_router(auth_routes.router)
app.include_router(projects.router)


@app.get("/")
def read_root():
    return {"message": "החיבור הצליח! שרת הפייתון מוכן ומגיב!"}
