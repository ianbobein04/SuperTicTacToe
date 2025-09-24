from __future__ import annotations
from pydantic import BaseModel
from typing import Optional, List, Literal

Player = Literal["X", "O"]

class GameCreate(BaseModel):
    # No starting_player; frontend owns turn order now.
    pass

class GameStateDTO(BaseModel):
    id: str
    board: List[Optional[Player]]
    winner: Optional[Player]
    is_draw: bool
    status: str

class MoveRequest(BaseModel):
    index: int
    player: Player