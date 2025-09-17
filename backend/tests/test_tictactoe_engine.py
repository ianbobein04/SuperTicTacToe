import pytest
from app.tictactoe.engine import new_game, move, available_moves, status

def test_new_game_initial_state():
    gs = new_game()
    assert gs.board == [None]*9
    assert gs.current_player == "X"
    assert gs.winner is None
    assert gs.is_draw is False
    assert status(gs) == "X's turn"

def test_valid_move_and_turn_switch():
    gs = new_game()
    gs = move(gs, 0)
    assert gs.board[0] == "X"
    assert gs.current_player == "O"
    assert gs.winner is None
    assert not gs.is_draw

def test_cannot_play_occupied_cell():
    gs = new_game()
    gs = move(gs, 0)
    with pytest.raises(ValueError):
        move(gs, 0)

def test_winning_rows_cols_diagonals():
    # Row win
    gs = new_game()
    gs = move(gs, 0) # X
    gs = move(gs, 3) # O
    gs = move(gs, 1) # X
    gs = move(gs, 4) # O
    gs = move(gs, 2) # X wins
    assert gs.winner == "X"

    # Column win
    gs = new_game()
    gs = move(gs, 0) # X
    gs = move(gs, 1) # O
    gs = move(gs, 3) # X
    gs = move(gs, 2) # O
    gs = move(gs, 6) # X wins
    assert gs.winner == "X"

    # Diagonal win
    gs = new_game()
    gs = move(gs, 0) # X
    gs = move(gs, 1) # O
    gs = move(gs, 4) # X
    gs = move(gs, 2) # O
    gs = move(gs, 8) # X wins
    assert gs.winner == "X"

def test_draw_condition():
    gs = new_game()
    # X O X
    # X X O
    # O X O
    # sequence crafted to avoid earlier wins
    seq = [0,1,2,5,3,6,4,8,7]
    for i in seq:
        gs = move(gs, i)
    assert gs.is_draw is True
    assert gs.winner is None

def test_available_moves_updates():
    gs = new_game()
    assert set(available_moves(gs)) == set(range(9))
    gs = move(gs, 4)
    assert 4 not in available_moves(gs)
    assert len(available_moves(gs)) == 8

def test_game_over_disallows_moves():
    gs = new_game()
    gs = move(gs, 0) # X
    gs = move(gs, 3) # O
    gs = move(gs, 1) # X
    gs = move(gs, 4) # O
    gs = move(gs, 2) # X wins
    with pytest.raises(ValueError):
        move(gs, 8)