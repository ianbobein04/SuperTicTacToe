from __future__ import annotations
from pydantic import BaseModel, Field, conint
from typing import Optional, List, Literal

Player = Literal["X", "O"]

class GameCreate(BaseModel):
    starting_player: Optional[Player] = Field(default="X")

class GameStateDTO(BaseModel):
    id: str
    board: List[Optional[Player]]
    current_player: Player
    winner: Optional[Player]
    is_draw: bool
    status: str

class MoveRequest(BaseModel):
    index: int