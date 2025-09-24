from __future__ import annotations
from fastapi import APIRouter, HTTPException
from uuid import uuid4
from typing import Dict, List

from .engine import GameState, new_game, move, status
from .schemas import GameCreate, GameStateDTO, MoveRequest

router = APIRouter(prefix="/tictactoe", tags=["tictactoe"])

# naive in-memory store; swap for a real cache/DB as needed
GAMES: Dict[str, List[GameState]] = {}

def _to_dto(game_id: str, gs: GameState) -> GameStateDTO:
    return GameStateDTO(
        id=game_id,
        board=gs.board,
        winner=gs.winner,
        is_draw=gs.is_draw,
        status=status(gs),
    )

@router.post("/new", response_model=GameStateDTO)
def create_game(_: GameCreate) -> GameStateDTO:
    gs = new_game()
    gid = str(uuid4())
    GAMES[gid] = [gs]
    return _to_dto(gid, gs)

@router.get("/{game_id}", response_model=GameStateDTO)
def get_state(game_id: str) -> GameStateDTO:
    history = GAMES.get(game_id)
    if not history:
        raise HTTPException(status_code=404, detail="Game not found.")
    return _to_dto(game_id, history[-1])

@router.get("/{game_id}/history", response_model=List[GameStateDTO])
def get_history(game_id: str) -> List[GameStateDTO]:
    history = GAMES.get(game_id)
    if not history:
        raise HTTPException(status_code=404, detail="Game not found.")
    return [_to_dto(game_id, g) for g in history]

@router.post("/{game_id}/move", response_model=GameStateDTO)
def make_move(game_id: str, payload: MoveRequest) -> GameStateDTO:
    history = GAMES.get(game_id)
    if not history:
        raise HTTPException(status_code=404, detail="Game not found.")
    gs = history[-1]
    try:
        ns = move(gs, payload.index, payload.player)
    except (IndexError, ValueError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    history.append(ns)
    return _to_dto(game_id, ns)

@router.delete("/{game_id}")
def delete_game(game_id: str) -> dict:
    if game_id in GAMES:
        del GAMES[game_id]
        return {"ok": True}
    return {"ok": False, "reason": "not found"}