from fastapi import APIRouter, HTTPException, status
import auth
from schemas import UserAuth

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(user_data: UserAuth):
    if not user_data.username or not user_data.password:
        raise HTTPException(status_code=400, detail="Username and password cannot be empty")
    return auth.register_user(user_data.username, user_data.password)


@router.post("/login")
def login(user_data: UserAuth):
    return auth.login_user(user_data.username, user_data.password)
