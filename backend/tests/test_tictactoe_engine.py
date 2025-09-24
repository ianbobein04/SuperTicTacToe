# tests/test_tictactoe_engine.py
import pytest
from app.tictactoe.engine import new_game, move, available_moves, status

def test_new_game_initial_state():
    gs = new_game()
    assert gs.board == [None] * 9
    assert gs.winner is None
    assert gs.is_draw is False
    assert status(gs) == "in progress"

def test_valid_move_and_no_turn_switch_in_engine():
    gs = new_game()
    gs = move(gs, 0, "X")  # engine does NOT flip turn
    assert gs.board[0] == "X"
    assert gs.winner is None
    assert not gs.is_draw

def test_cannot_play_occupied_cell():
    gs = new_game()
    gs = move(gs, 0, "X")
    with pytest.raises(ValueError):
        move(gs, 0, "O")

def test_winning_rows_cols_diagonals():
    # Row win by X
    gs = new_game()
    gs = move(gs, 0, "X")
    gs = move(gs, 3, "O")
    gs = move(gs, 1, "X")
    gs = move(gs, 4, "O")
    gs = move(gs, 2, "X")
    assert gs.winner == "X"
    assert status(gs) == "X wins"

    # Column win by X
    gs = new_game()
    gs = move(gs, 0, "X")
    gs = move(gs, 1, "O")
    gs = move(gs, 3, "X")
    gs = move(gs, 2, "O")
    gs = move(gs, 6, "X")
    assert gs.winner == "X"

    # Diagonal win by X
    gs = new_game()
    gs = move(gs, 0, "X")
    gs = move(gs, 1, "O")
    gs = move(gs, 4, "X")
    gs = move(gs, 2, "O")
    gs = move(gs, 8, "X")
    assert gs.winner == "X"

def test_draw_condition():
    # X O X / X X O / O X O (no winner)
    gs = new_game()
    seq = [(0,"X"), (1,"O"), (2,"X"),
           (5,"O"), (3,"X"), (6,"O"),
           (4,"X"), (8,"O"), (7,"X")]
    for idx, p in seq:
        gs = move(gs, idx, p)
    assert gs.is_draw is True
    assert gs.winner is None
    assert status(gs) == "draw"

def test_available_moves_updates():
    gs = new_game()
    assert set(available_moves(gs)) == set(range(9))
    gs = move(gs, 4, "X")
    assert 4 not in available_moves(gs)
    assert len(available_moves(gs)) == 8

def test_game_over_disallows_moves():
    gs = new_game()
    gs = move(gs, 0, "X")
    gs = move(gs, 3, "O")
    gs = move(gs, 1, "X")
    gs = move(gs, 4, "O")
    gs = move(gs, 2, "X")  # X wins
    with pytest.raises(ValueError):
        move(gs, 8, "O")