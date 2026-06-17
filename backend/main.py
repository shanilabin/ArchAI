from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from dotenv import load_dotenv

load_dotenv()

import database
database.init_db() 
from config import UPLOAD_DIR
from routers import auth_routes, projects

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


app.include_router(auth_routes.router)
app.include_router(projects.router)


@app.get("/")
def read_root():
    return {"message": "החיבור הצליח! שרת הפייתון מוכן ומגיב!"}