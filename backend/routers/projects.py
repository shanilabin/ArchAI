from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import StreamingResponse
import io
import os
import json
import shutil
import uuid

import crud
import reports
import vision
import render

from deps import get_current_user, get_owned_project
from config import UPLOAD_DIR
from schemas import ProjectCreate, ItemCreate, RenderRequest, KitchenRender, RoomFurnishRender


router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.get("")
def list_projects(current_user: dict = Depends(get_current_user)):
    return crud.get_projects_by_user(current_user["id"])


@router.post("", status_code=status.HTTP_201_CREATED)
def create_project(project: ProjectCreate, current_user: dict = Depends(get_current_user)):
    name = project.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Project name cannot be empty")
    return crud.create_project(current_user["id"], name)


@router.get("/{project_id}")
def get_project(project: dict = Depends(get_owned_project)):
    return project


@router.post("/{project_id}/upload")
def upload_drawing(project_id: int, file: UploadFile = File(...), project: dict = Depends(get_owned_project)):
    ext = os.path.splitext(file.filename)[1]
    filename = f"project_{project_id}_{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    url = f"/uploads/{filename}"
    crud.set_project_drawing(project_id, url)
    return {"original_drawing_url": url}


@router.post("/{project_id}/check")
def check_drawing(project_id: int, project: dict = Depends(get_owned_project)):
    url = project.get("original_drawing_url")
    if not url:
        raise HTTPException(status_code=400, detail="No drawing uploaded yet")
    filepath = os.path.join(UPLOAD_DIR, os.path.basename(url))
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Drawing file not found")
    try:
        issues = vision.analyze_drawing(filepath)
    except Exception as e:
        msg = str(e).split("?key=")[0]
        raise HTTPException(status_code=502, detail=f"AI check failed: {msg}")
    crud.save_issues(project_id, issues)
    crud.set_project_status(project_id, "checked")
    return {"issues": issues}


@router.post("/{project_id}/render")
def render_project(project_id: int, materials: RenderRequest, project: dict = Depends(get_owned_project)):
    url = project.get("original_drawing_url")
    if not url:
        raise HTTPException(status_code=400, detail="No drawing uploaded yet")
    filepath = os.path.join(UPLOAD_DIR, os.path.basename(url))
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Drawing file not found")

    if materials.room_name:
        # רינדור חדר ספציפי (text-to-image לפי שם החדר + חומרים + טקסט חופשי)
        prompt = render.build_room_prompt(materials.room_name, materials.wall_color,
                                          materials.flooring, materials.style, materials.extra)
        render_type = "room"  # 'plan' = text-to-image
    else:
        prompt = render.build_prompt(materials.wall_color, materials.flooring, materials.style,
                                     materials.drawing_type, materials.angle)
        render_type = materials.drawing_type

    try:
        img_bytes, mime = render.render_drawing(filepath, prompt, render_type)
    except Exception as e:
        msg = str(e).split("?key=")[0]
        raise HTTPException(status_code=502, detail=f"Render failed: {msg}")

    ext = ".webp" if "webp" in mime else (".png" if "png" in mime else ".jpg")
    filename = f"render_{project_id}_{uuid.uuid4().hex}{ext}"
    with open(os.path.join(UPLOAD_DIR, filename), "wb") as f:
        f.write(img_bytes)
    image_url = f"/uploads/{filename}"

    materials_json = json.dumps({
        "room_name": materials.room_name,
        "wall_color": materials.wall_color,
        "flooring": materials.flooring,
        "style": materials.style,
        "extra": materials.extra,
    }, ensure_ascii=False)
    crud.add_render(project_id, materials_json, prompt, image_url)
    crud.set_project_status(project_id, "rendered")
    return {"image_url": image_url, "prompt": prompt}


@router.get("/{project_id}/renders")
def list_renders(project_id: int, project: dict = Depends(get_owned_project)):
    return crud.get_renders(project_id)


@router.get("/{project_id}/items")
def list_items(project_id: int, project: dict = Depends(get_owned_project)):
    return crud.get_items(project_id)


@router.post("/{project_id}/items", status_code=status.HTTP_201_CREATED)
def add_item(project_id: int, item: ItemCreate, project: dict = Depends(get_owned_project)):
    crud.add_item(project_id, item)
    return {"message": "Item added"}


@router.get("/{project_id}/boq.xlsx")
def export_boq(project_id: int, project: dict = Depends(get_owned_project)):
    data = crud.get_items_for_excel(project_id)
    if not data:
        raise HTTPException(status_code=404, detail="No items to export")
    excel_bytes = reports.generate_quantity_survey_excel(project["name"], data)
    safe_name = project["name"].replace(" ", "_")
    return StreamingResponse(
        io.BytesIO(excel_bytes),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={safe_name}_survey.xlsx"},
    )


@router.delete("/{project_id}")
def delete_project(project_id: int, project: dict = Depends(get_owned_project)):
    crud.delete_project(project_id)
    return {"message": "Project deleted"}


@router.get("/{project_id}/issues")
def list_issues(project_id: int, project: dict = Depends(get_owned_project)):
    return crud.get_issues(project_id)


@router.post("/{project_id}/analyze")
def analyze_drawing(project_id: int, project: dict = Depends(get_owned_project)):
    url = project.get("original_drawing_url")
    if not url:
        raise HTTPException(status_code=400, detail="No drawing uploaded yet")
    filepath = os.path.join(UPLOAD_DIR, os.path.basename(url))
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Drawing file not found")
    try:
        result = vision.describe_drawing(filepath)
    except Exception as e:
        msg = str(e).split("?key=")[0]
        raise HTTPException(status_code=502, detail=f"Analyze failed: {msg}")
    return result


@router.post("/{project_id}/detect-rooms")
def detect_rooms_endpoint(project_id: int, project: dict = Depends(get_owned_project)):
    url = project.get("original_drawing_url")
    if not url:
        raise HTTPException(status_code=400, detail="No drawing uploaded yet")
    filepath = os.path.join(UPLOAD_DIR, os.path.basename(url))
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Drawing file not found")
    try:
        rooms = vision.detect_rooms(filepath)
    except Exception as e:
        msg = str(e).split("?key=")[0]
        raise HTTPException(status_code=502, detail=f"Detect rooms failed: {msg}")
    return {"rooms": rooms}

@router.post("/{project_id}/detect-kitchen")
def detect_kitchen_endpoint(project_id: int, project: dict = Depends(get_owned_project)):
    url = project.get("original_drawing_url")
    if not url:
        raise HTTPException(status_code=400, detail="No drawing uploaded yet")
    filepath = os.path.join(UPLOAD_DIR, os.path.basename(url))
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Drawing file not found")
    try:
        elements = vision.detect_kitchen(filepath)
    except Exception as e:
        msg = str(e).split("?key=")[0]
        raise HTTPException(status_code=502, detail=f"Detect kitchen failed: {msg}")
    return {"elements": elements}




@router.post("/{project_id}/render-kitchen")
def render_kitchen(project_id: int, data: KitchenRender, project: dict = Depends(get_owned_project)):
    url = project.get("original_drawing_url")
    if not url:
        raise HTTPException(status_code=400, detail="No drawing uploaded yet")
    filepath = os.path.join(UPLOAD_DIR, os.path.basename(url))
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Drawing file not found")

    prompt = render.build_kitchen_prompt(
        data.cabinets, data.island, data.countertop,
        data.appliances, data.style, data.extra, data.has_island,
    )
    try:
        img_bytes, mime = render.render_drawing(filepath, prompt, "room")  # text-to-image
    except Exception as e:
        msg = str(e).split("?key=")[0]
        raise HTTPException(status_code=502, detail=f"Render failed: {msg}")

    ext = ".webp" if "webp" in mime else (".png" if "png" in mime else ".jpg")
    filename = f"render_{project_id}_{uuid.uuid4().hex}{ext}"
    with open(os.path.join(UPLOAD_DIR, filename), "wb") as f:
        f.write(img_bytes)
    image_url = f"/uploads/{filename}"

    materials_json = json.dumps({"kitchen": True, "cabinets": data.cabinets, "island": data.island,
                                 "countertop": data.countertop, "appliances": data.appliances,
                                 "style": data.style, "extra": data.extra}, ensure_ascii=False)
    crud.add_render(project_id, materials_json, prompt, image_url)
    crud.set_project_status(project_id, "rendered")
    return {"image_url": image_url, "prompt": prompt}

@router.post("/{project_id}/detect-furniture")
def detect_furniture_endpoint(project_id: int, project: dict = Depends(get_owned_project)):
    url = project.get("original_drawing_url")
    if not url:
        raise HTTPException(status_code=400, detail="No drawing uploaded yet")
    filepath = os.path.join(UPLOAD_DIR, os.path.basename(url))
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Drawing file not found")
    try:
        items = vision.detect_furniture(filepath)
    except Exception as e:
        msg = str(e).split("?key=")[0]
        raise HTTPException(status_code=502, detail=f"Detect furniture failed: {msg}")
    return {"items": items}


@router.post("/{project_id}/render-room")
def render_room(project_id: int, data: RoomFurnishRender, project: dict = Depends(get_owned_project)):
    url = project.get("original_drawing_url")
    if not url:
        raise HTTPException(status_code=400, detail="No drawing uploaded yet")
    filepath = os.path.join(UPLOAD_DIR, os.path.basename(url))
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Drawing file not found")

    prompt = render.build_furnish_prompt(data.room_type, data.wall_color, data.flooring,
                                         data.furniture, data.style, data.extra)
    try:
        img_bytes, mime = render.render_drawing(filepath, prompt, "plan")  # text-to-image
    except Exception as e:
        msg = str(e).split("?key=")[0]
        raise HTTPException(status_code=502, detail=f"Render failed: {msg}")

    ext = ".webp" if "webp" in mime else (".png" if "png" in mime else ".jpg")
    filename = f"render_{project_id}_{uuid.uuid4().hex}{ext}"
    with open(os.path.join(UPLOAD_DIR, filename), "wb") as f:
        f.write(img_bytes)
    image_url = f"/uploads/{filename}"

    materials_json = json.dumps({"room": True, "room_type": data.room_type, "furniture": data.furniture,
                                 "wall_color": data.wall_color, "flooring": data.flooring,
                                 "style": data.style, "extra": data.extra}, ensure_ascii=False)
    crud.add_render(project_id, materials_json, prompt, image_url)
    crud.set_project_status(project_id, "rendered")
    return {"image_url": image_url, "prompt": prompt}

@router.post("/{project_id}/suggest-boq")
def suggest_boq_endpoint(project_id: int, project: dict = Depends(get_owned_project)):
    url = project.get("original_drawing_url")
    if not url:
        raise HTTPException(status_code=400, detail="No drawing uploaded yet")
    filepath = os.path.join(UPLOAD_DIR, os.path.basename(url))
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Drawing file not found")
    try:
        items = vision.suggest_boq(filepath)
    except Exception as e:
        msg = str(e).split("?key=")[0]
        raise HTTPException(status_code=502, detail=f"BOQ suggestion failed: {msg}")
    # שמירת הפריטים שהוצעו לפרויקט
    for it in items:
        crud.add_item_dict(project_id, it)
    return {"items": items}