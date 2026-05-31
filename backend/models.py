# backend/models.py
from pydantic import BaseModel
from typing import Optional

class EnvironmentalAction(BaseModel):
    action_id: int
    title: str
    description: str
    max_participants: int
    status: str