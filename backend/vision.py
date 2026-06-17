import os
import base64
import json
import time
import requests
from dotenv import load_dotenv

load_dotenv()

GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-flash-latest"]

PROMPT = """אתה מהנדס בניין שבודק תוכנית קומה אדריכלית (מבט-על).
זהה עד 6 בעיות תכנון אפשריות (למשל: חדר ללא חלון, מרווח חריג בין עמודים, קיר ממ"ד דק, מעבר צר).
לכל בעיה ציין מיקום מדויק על התמונה:
- x = אחוז מהקצה השמאלי (0 = שמאל, 100 = ימין)
- y = אחוז מהקצה העליון (0 = למעלה, 100 = למטה)
מקם את הנקודה במרכז האזור הבעייתי. הקפד שהערכים יהיו בין 0 ל-100 בלבד (בתוך גבולות התמונה).
החזר אך ורק JSON בפורמט: {"issues": [{"x": <0-100>, "y": <0-100>, "severity": "review" או "warning" או "info", "description": "<משפט קצר בעברית>"}]}
נסח כל בעיה כ"דגל לבדיקת מהנדס", לא כפסק דין. אם אינך בטוח — אל תכלול. אם אין בעיות — {"issues": []}.
"""


def _guess_mime(filepath):
    ext = os.path.splitext(filepath)[1].lower()
    return {
        ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
        ".webp": "image/webp", ".gif": "image/gif",
    }.get(ext, "image/png")


def _clamp(v):
    return max(0.0, min(100.0, float(v)))


def _parse_issues(data):
    text = data["candidates"][0]["content"]["parts"][0]["text"]
    parsed = json.loads(text)
    issues = parsed.get("issues", [])
    clean = []
    for it in issues:
        try:
            clean.append({
                "x": _clamp(it["x"]),
                "y": _clamp(it["y"]),
                "severity": it.get("severity", "review"),
                "description": str(it.get("description", "")),
            })
        except (KeyError, ValueError, TypeError):
            continue
    return clean


def analyze_drawing(filepath):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not set in .env")

    with open(filepath, "rb") as f:
        image_b64 = base64.b64encode(f.read()).decode("utf-8")

    body = {
        "contents": [{
            "parts": [
                {"text": PROMPT},
                {"inline_data": {"mime_type": _guess_mime(filepath), "data": image_b64}},
            ]
        }],
        "generationConfig": {"response_mime_type": "application/json"},
    }

    last_status = None
    last_reason = ""
    for model in GEMINI_MODELS:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
        for attempt in range(2):
            resp = requests.post(url, params={"key": api_key}, json=body, timeout=60)
            if resp.status_code == 200:
                return _parse_issues(resp.json())
            last_status = resp.status_code
            try:
                last_reason = resp.json().get("error", {}).get("message", "")
            except Exception:
                last_reason = ""
            if resp.status_code in (503, 429):
                time.sleep(2)
                continue
            break
    raise RuntimeError(f"Gemini busy ({last_status}): {last_reason}")
DESCRIBE_PROMPT = """אתה אדריכל שמסתכל על שרטוט. זהה מה הוא מתאר.
החזר אך ורק JSON: {"space_type": "<אחד מ: kitchen, living_room, bedroom, bathroom, facade, full_plan, other>", "summary": "<משפט קצר בעברית שמתאר מה רואים בשרטוט>"}
"""


def describe_drawing(filepath):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not set in .env")

    with open(filepath, "rb") as f:
        image_b64 = base64.b64encode(f.read()).decode("utf-8")

    body = {
        "contents": [{
            "parts": [
                {"text": DESCRIBE_PROMPT},
                {"inline_data": {"mime_type": _guess_mime(filepath), "data": image_b64}},
            ]
        }],
        "generationConfig": {"response_mime_type": "application/json"},
    }

    last_status, last_reason = None, ""
    for model in GEMINI_MODELS:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
        for attempt in range(2):
            resp = requests.post(url, params={"key": api_key}, json=body, timeout=60)
            if resp.status_code == 200:
                text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
                data = json.loads(text)
                return {
                    "space_type": str(data.get("space_type", "other")),
                    "summary": str(data.get("summary", "")),
                }
            last_status = resp.status_code
            try:
                last_reason = resp.json().get("error", {}).get("message", "")
            except Exception:
                last_reason = ""
            if resp.status_code in (503, 429):
                time.sleep(2)
                continue
            break
    raise RuntimeError(f"Gemini busy ({last_status}): {last_reason}")

ROOMS_PROMPT = """You are an architect analyzing a 2D floor plan. Floor plans usually contain TEXT LABELS naming each space — use them.
For each space: read its label and return a bounding box of the label's location, normalized 0-1000, format [ymin, xmin, ymax, xmax].
Include ALL space types: rooms, kitchen, living room, dining area, entrance/foyer, stairs, hallway, toilet, bathroom, balcony, safe room.
IMPORTANT: Return each physical space EXACTLY ONCE. Do NOT repeat the same space. If the plan contains several identical rooms (e.g., 3 bedrooms), return each one once with its own location.
Return "name" in HEBREW and "name_en" in ENGLISH.
Return ONLY JSON: {"rooms": [{"name": "<hebrew>", "name_en": "<english>", "box_2d": [ymin, xmin, ymax, xmax]}]}
Maximum 12 spaces total. If this is not a floor plan, return {"rooms": []}.
"""


def _dedupe_rooms(rooms, min_dist=7.0, max_rooms=12):
    """מסיר כפילויות: אם שני חללים עם אותו שם קרובים זה לזה — משאירים אחד."""
    unique = []
    for r in rooms:
        is_dup = False
        for u in unique:
            same_name = (r["name"] == u["name"]) or (r["name_en"].lower() == u["name_en"].lower())
            dist = ((r["x"] - u["x"]) ** 2 + (r["y"] - u["y"]) ** 2) ** 0.5
            if same_name and dist < min_dist:
                is_dup = True
                break
        if not is_dup:
            unique.append(r)
        if len(unique) >= max_rooms:
            break
    return unique


def detect_rooms(filepath):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not set in .env")

    with open(filepath, "rb") as f:
        image_b64 = base64.b64encode(f.read()).decode("utf-8")

    body = {
        "contents": [{
            "parts": [
                {"text": ROOMS_PROMPT},
                {"inline_data": {"mime_type": _guess_mime(filepath), "data": image_b64}},
            ]
        }],
        "generationConfig": {"response_mime_type": "application/json"},
    }

    last_status, last_reason = None, ""
    for model in GEMINI_MODELS:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
        for attempt in range(2):
            resp = requests.post(url, params={"key": api_key}, json=body, timeout=60)
            if resp.status_code == 200:
                text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
                data = json.loads(text)
                rooms = []
                for r in data.get("rooms", []):
                    try:
                        box = r["box_2d"]
                        ymin, xmin, ymax, xmax = float(box[0]), float(box[1]), float(box[2]), float(box[3])
                        cx = max(0.0, min(100.0, ((xmin + xmax) / 2) / 10.0))
                        cy = max(0.0, min(100.0, ((ymin + ymax) / 2) / 10.0))
                        rooms.append({
                            "name": str(r.get("name", "חלל")),
                            "name_en": str(r.get("name_en", "room")),
                            "x": cx, "y": cy,
                        })
                    except (KeyError, ValueError, TypeError, IndexError):
                        continue
                return _dedupe_rooms(rooms)
            last_status = resp.status_code
            try:
                last_reason = resp.json().get("error", {}).get("message", "")
            except Exception:
                last_reason = ""
            if resp.status_code in (503, 429):
                time.sleep(2)
                continue
            break
    raise RuntimeError(f"Gemini busy ({last_status}): {last_reason}")

KITCHEN_PROMPT = """You are a kitchen designer analyzing a kitchen plan or layout (top view or elevation).
Detect the kitchen elements: cabinets, fridge, oven, stove/cooktop, sink, dishwasher, countertop, island, hood.
For each element return a bounding box of its location, normalized 0-1000, format [ymin, xmin, ymax, xmax].
Return "name" in HEBREW and "name_en" in ENGLISH (e.g., fridge, oven, sink, base cabinets, island).
Return ONLY JSON: {"elements": [{"name": "<hebrew>", "name_en": "<english>", "box_2d": [ymin, xmin, ymax, xmax]}]}
Detect up to 12 elements. If this is not a kitchen, return {"elements": []}.
"""


def detect_kitchen(filepath):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not set in .env")

    with open(filepath, "rb") as f:
        image_b64 = base64.b64encode(f.read()).decode("utf-8")

    body = {
        "contents": [{
            "parts": [
                {"text": KITCHEN_PROMPT},
                {"inline_data": {"mime_type": _guess_mime(filepath), "data": image_b64}},
            ]
        }],
        "generationConfig": {"response_mime_type": "application/json"},
    }

    last_status, last_reason = None, ""
    for model in GEMINI_MODELS:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
        for attempt in range(2):
            resp = requests.post(url, params={"key": api_key}, json=body, timeout=60)
            if resp.status_code == 200:
                text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
                data = json.loads(text)
                elements = []
                for r in data.get("elements", []):
                    try:
                        box = r["box_2d"]
                        ymin, xmin, ymax, xmax = float(box[0]), float(box[1]), float(box[2]), float(box[3])
                        cx = max(0.0, min(100.0, ((xmin + xmax) / 2) / 10.0))
                        cy = max(0.0, min(100.0, ((ymin + ymax) / 2) / 10.0))
                        elements.append({
                            "name": str(r.get("name", "אלמנט")),
                            "name_en": str(r.get("name_en", "element")),
                            "x": cx, "y": cy,
                        })
                    except (KeyError, ValueError, TypeError, IndexError):
                        continue
                return elements
            last_status = resp.status_code
            try:
                last_reason = resp.json().get("error", {}).get("message", "")
            except Exception:
                last_reason = ""
            if resp.status_code in (503, 429):
                time.sleep(2)
                continue
            break
    raise RuntimeError(f"Gemini busy ({last_status}): {last_reason}")

FURNITURE_PROMPT = """You are an interior designer analyzing a room plan or photo.
Detect the furniture and fixtures in the room: bed, sofa, table, chairs, wardrobe/closet, desk, shelves, nightstand, TV unit, lamp.
For each item return a bounding box of its location, normalized 0-1000, format [ymin, xmin, ymax, xmax].
Return "name" in HEBREW and "name_en" in ENGLISH (e.g., bed, sofa, wardrobe, desk).
Return ONLY JSON: {"items": [{"name": "<hebrew>", "name_en": "<english>", "box_2d": [ymin, xmin, ymax, xmax]}]}
Detect up to 12 items. If no furniture is visible, return {"items": []}.
"""


def detect_furniture(filepath):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not set in .env")

    with open(filepath, "rb") as f:
        image_b64 = base64.b64encode(f.read()).decode("utf-8")

    body = {
        "contents": [{
            "parts": [
                {"text": FURNITURE_PROMPT},
                {"inline_data": {"mime_type": _guess_mime(filepath), "data": image_b64}},
            ]
        }],
        "generationConfig": {"response_mime_type": "application/json"},
    }

    last_status, last_reason = None, ""
    for model in GEMINI_MODELS:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
        for attempt in range(2):
            resp = requests.post(url, params={"key": api_key}, json=body, timeout=60)
            if resp.status_code == 200:
                text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
                data = json.loads(text)
                items = []
                for r in data.get("items", []):
                    try:
                        box = r["box_2d"]
                        ymin, xmin, ymax, xmax = float(box[0]), float(box[1]), float(box[2]), float(box[3])
                        cx = max(0.0, min(100.0, ((xmin + xmax) / 2) / 10.0))
                        cy = max(0.0, min(100.0, ((ymin + ymax) / 2) / 10.0))
                        items.append({
                            "name": str(r.get("name", "רהיט")),
                            "name_en": str(r.get("name_en", "furniture")),
                            "x": cx, "y": cy,
                        })
                    except (KeyError, ValueError, TypeError, IndexError):
                        continue
                return items
            last_status = resp.status_code
            try:
                last_reason = resp.json().get("error", {}).get("message", "")
            except Exception:
                last_reason = ""
            if resp.status_code in (503, 429):
                time.sleep(2)
                continue
            break
    raise RuntimeError(f"Gemini busy ({last_status}): {last_reason}")

BOQ_PROMPT = """You are a quantity surveyor analyzing an architectural drawing.
Estimate a Bill of Quantities (BOQ) — the main construction/finish items visible or implied in the drawing.
For each item provide: a code, a short Hebrew description, a unit, an estimated quantity (number), and an estimated unit price in ILS (number).
Use realistic Israeli construction prices.
Return ONLY JSON: {"items": [{"item_code": "01.01", "description": "<תיאור בעברית>", "unit": "<מ\\"ר / מ\\"ק / יח'>", "quantity": <number>, "unit_price": <number>}]}
Provide between 5 and 12 items. If you cannot analyze, return {"items": []}.
"""


def suggest_boq(filepath):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not set in .env")

    with open(filepath, "rb") as f:
        image_b64 = base64.b64encode(f.read()).decode("utf-8")

    body = {
        "contents": [{
            "parts": [
                {"text": BOQ_PROMPT},
                {"inline_data": {"mime_type": _guess_mime(filepath), "data": image_b64}},
            ]
        }],
        "generationConfig": {"response_mime_type": "application/json"},
    }

    last_status, last_reason = None, ""
    for model in GEMINI_MODELS:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
        for attempt in range(2):
            resp = requests.post(url, params={"key": api_key}, json=body, timeout=60)
            if resp.status_code == 200:
                text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
                data = json.loads(text)
                items = []
                for r in data.get("items", []):
                    try:
                        items.append({
                            "item_code": str(r.get("item_code", "")),
                            "description": str(r.get("description", "")),
                            "unit": str(r.get("unit", "")),
                            "quantity": float(r.get("quantity", 0) or 0),
                            "unit_price": float(r.get("unit_price", 0) or 0),
                        })
                    except (ValueError, TypeError):
                        continue
                return items
            last_status = resp.status_code
            try:
                last_reason = resp.json().get("error", {}).get("message", "")
            except Exception:
                last_reason = ""
            if resp.status_code in (503, 429):
                time.sleep(2)
                continue
            break
    raise RuntimeError(f"Gemini busy ({last_status}): {last_reason}")