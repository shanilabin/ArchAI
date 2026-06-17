from fastapi import Header, HTTPException, Depends
import auth
import crud


def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token is required")
    token = authorization.split(" ")[1]
    user_info = auth.verify_token(token)
    if not user_info:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user_info


def get_owned_project(project_id: int, current_user: dict = Depends(get_current_user)):
    project = crud.get_project(project_id, current_user["id"])
    if not project:
        raise HTTPException(status_code=404, detail="Project not found or access denied")
    return project
