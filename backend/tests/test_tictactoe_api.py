# tests/test_tictactoe_api.py
from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.tictactoe.router import router

app = FastAPI()
app.include_router(router)
client = TestClient(app)

def test_create_and_get_game():
    r = client.post("/tictactoe/new", json={})
    assert r.status_code == 200
    data = r.json()
    gid = data["id"]
    assert "board" in data
    assert data["winner"] is None
    assert data["is_draw"] is False
    assert data["status"] in {"in progress", "draw", "X wins", "O wins"}

    r = client.get(f"/tictactoe/{gid}")
    assert r.status_code == 200
    data2 = r.json()
    assert data2["id"] == gid
    assert data2["board"] == [None] * 9

def test_make_move_and_win_flow():
    gid = client.post("/tictactoe/new", json={}).json()["id"]

    # X 0, O 3, X 1, O 4, X 2 -> X wins
    assert client.post(f"/tictactoe/{gid}/move", json={"index": 0, "player": "X"}).status_code == 200
    assert client.post(f"/tictactoe/{gid}/move", json={"index": 3, "player": "O"}).status_code == 200
    assert client.post(f"/tictactoe/{gid}/move", json={"index": 1, "player": "X"}).status_code == 200
    assert client.post(f"/tictactoe/{gid}/move", json={"index": 4, "player": "O"}).status_code == 200
    r = client.post(f"/tictactoe/{gid}/move", json={"index": 2, "player": "X"})
    assert r.status_code == 200
    data = r.json()
    assert data["winner"] == "X"
    assert data["status"].startswith("X wins")

def test_bad_requests():
    gid = client.post("/tictactoe/new", json={}).json()["id"]

    # Missing player -> FastAPI validation (422)
    r = client.post(f"/tictactoe/{gid}/move", json={"index": 0})
    assert r.status_code == 422

    # Out of range -> engine raises -> 400
    r = client.post(f"/tictactoe/{gid}/move", json={"index": 99, "player": "X"})
    assert r.status_code == 400
    assert "Index must be in range" in r.json()["detail"]

    # Occupied cell -> 400
    client.post(f"/tictactoe/{gid}/move", json={"index": 0, "player": "X"})
    r = client.post(f"/tictactoe/{gid}/move", json={"index": 0, "player": "O"})
    assert r.status_code == 400
    assert "Cell already occupied" in r.json()["detail"]
