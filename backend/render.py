import os
import time
import base64
import requests
from dotenv import load_dotenv

load_dotenv()

HORDE_API = "https://aihorde.net/api/v2"
HORDE_KEY = os.getenv("AIHORDE_API_KEY", "0000000000")
HEADERS = {"apikey": HORDE_KEY, "Client-Agent": "ArchAI:1.0:student-project"}


def build_prompt(wall_color="", flooring="", style="", drawing_type="plan", angle=""):
    s = f"{style} style, " if style else ""
    wall = f"{wall_color} walls, " if wall_color else ""
    floor = f"{flooring} floor, " if flooring else ""
    if drawing_type == "elevation":
        view = {
            "front": "front elevation view",
            "angle": "three-quarter angle view",
            "perspective": "wide perspective street view",
        }.get(angle, "front view")
        return (f"photorealistic exterior architectural visualization of a building facade, {view}, {s}"
                f"{wall}realistic materials, daylight, professional architectural photography, ultra detailed")
    if drawing_type == "room":
        return (f"photorealistic interior of this room, {s}{wall}{floor}"
                "furnished, large windows, natural daylight, wide angle, architectural photography, ultra detailed")
    return (f"photorealistic interior design photograph of a furnished apartment living room, {s}{wall}{floor}"
            "large windows, natural daylight, wide angle, architectural photography, ultra detailed, realistic")

def _poll_and_get(job_id):
    for _ in range(120):  # עד ~6 דקות (ControlNet איטי יותר)
        time.sleep(3)
        check = requests.get(f"{HORDE_API}/generate/check/{job_id}", headers=HEADERS, timeout=30)
        check.raise_for_status()
        st = check.json()
        if st.get("done"):
            break
        if st.get("faulted"):
            raise RuntimeError("AI Horde generation faulted")
    else:
        raise RuntimeError("AI Horde timed out (try again)")

    result = requests.get(f"{HORDE_API}/generate/status/{job_id}", headers=HEADERS, timeout=30)
    result.raise_for_status()
    gens = result.json().get("generations", [])
    if not gens:
        raise RuntimeError("AI Horde returned no image")
    img_field = gens[0]["img"]
    if img_field.startswith("http"):
        r = requests.get(img_field, timeout=60)
        r.raise_for_status()
        return r.content, "image/webp"
    return base64.b64decode(img_field), "image/webp"


def render_drawing(filepath, prompt, drawing_type="plan"):
    payload = {
        "prompt": prompt,
        "params": {
            "sampler_name": "k_euler_a",
            "cfg_scale": 7,
            "width": 640,
            "height": 448,
            "steps": 25,
            "n": 1,
        },
        "nsfw": True,
        "censor_nsfw": False,
        "r2": True,
    }

    # חזית/חדר → ControlNet (נצמד לקווים של השרטוט). תוכנית → text-to-image.
    if drawing_type in ("elevation", "room"):
        with open(filepath, "rb") as f:
            payload["source_image"] = base64.b64encode(f.read()).decode("utf-8")
        payload["source_processing"] = "img2img"
        payload["params"]["control_type"] = "canny"        # ControlNet — שומר על הקווים
        payload["params"]["denoising_strength"] = 0.85

    resp = requests.post(f"{HORDE_API}/generate/async", headers=HEADERS, json=payload, timeout=30)
    if resp.status_code not in (200, 202):
        try:
            reason = resp.json().get("message", "")
        except Exception:
            reason = resp.text[:200]
        raise RuntimeError(f"AI Horde error {resp.status_code}: {reason}")
    return _poll_and_get(resp.json()["id"])

def build_kitchen_prompt(cabinets="", island="", countertop="", appliances="", style="", extra="", has_island=False):
    parts = ["photorealistic modern kitchen interior,"]
    if style:
        parts.append(f"{style} style,")
    if cabinets:
        parts.append(f"{cabinets} cabinets,")
    if has_island and island:
        parts.append(f"a kitchen island with {island} finish,")
    if countertop:
        parts.append(f"{countertop} countertops,")
    if appliances:
        parts.append(f"{appliances} appliances,")
    if extra:
        parts.append(f"{extra},")
    parts.append("realistic materials, natural daylight, wide angle, architectural photography, ultra detailed")
    return " ".join(parts)