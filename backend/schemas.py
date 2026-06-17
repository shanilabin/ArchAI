from pydantic import BaseModel


class UserAuth(BaseModel):
    username: str
    password: str


class ProjectCreate(BaseModel):
    name: str


class ItemCreate(BaseModel):
    item_code: str
    description: str
    unit: str
    quantity: float
    unit_price: float
class RenderRequest(BaseModel):
    wall_color: str = ""
    flooring: str = ""
    style: str = ""
    drawing_type: str = "plan"
    angle: str = ""
    room_name: str = ""
    extra: str = ""

class KitchenRender(BaseModel):
    cabinets: str = ""
    island: str = ""
    countertop: str = ""
    appliances: str = ""
    style: str = ""
    extra: str = ""
    has_island: bool = False

class RoomFurnishRender(BaseModel):
    room_type: str = "bedroom"
    wall_color: str = ""
    flooring: str = ""
    furniture: str = ""
    style: str = ""
    extra: str = ""