import "@testing-library/jest-dom";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

/* =============================================================================
   Shared types & helpers
============================================================================= */
type Player = "X" | "O";
type Cell = Player | null;

const WIN_LINES: [number, number, number][] = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6],
];

const win3 = (b: Cell[]): Player | null => {
  for (const [a, b2, c] of WIN_LINES) {
    const v = b[a];
    if (v && v === b[b2] && v === b[c]) return v;
  }
  return null;
};

/* =============================================================================
   CLASSIC TicTacToe (turn-agnostic mock)
   - No current_player
   - Accepts body { index, player? } (defaults to 'X' if missing)
============================================================================= */

let CLASSIC_STATE = {
  id: `T3-${Date.now()}`,
  board: Array<Cell>(9).fill(null),
  winner: null as Player | null,
  is_draw: false,
  status: "in progress",
};

const classicHandlers = [
  http.post("http://localhost:8000/tictactoe/new", () => {
    CLASSIC_STATE = {
      id: `T3-${Date.now()}`,
      board: Array<Cell>(9).fill(null),
      winner: null,
      is_draw: false,
      status: "in progress",
    };
    return HttpResponse.json(CLASSIC_STATE);
  }),

  http.post("http://localhost:8000/tictactoe/:id/move", async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as {
      index?: number;
      player?: Player;
    };
    const index = body.index;
    const player: Player = body.player ?? "X"; // tolerate tests/components that don’t pass player

    if (typeof index !== "number" || index < 0 || index > 8) {
      return HttpResponse.json({ detail: "bad index" }, { status: 400 });
    }
    if (CLASSIC_STATE.winner || CLASSIC_STATE.is_draw) {
      return HttpResponse.json({ detail: "game over" }, { status: 400 });
    }
    if (CLASSIC_STATE.board[index] !== null) {
      return HttpResponse.json({ detail: "occupied" }, { status: 400 });
    }

    // apply move
    const next = CLASSIC_STATE.board.slice();
    next[index] = player;
    CLASSIC_STATE.board = next;

    // resolve result
    const w = win3(CLASSIC_STATE.board);
    if (w) {
      CLASSIC_STATE.winner = w;
      CLASSIC_STATE.status = `${w} wins`;
    } else if (CLASSIC_STATE.board.every((c) => c !== null)) {
      CLASSIC_STATE.is_draw = true;
      CLASSIC_STATE.status = "draw";
    } else {
      CLASSIC_STATE.status = "in progress";
    }

    return HttpResponse.json(CLASSIC_STATE);
  }),
];

/* =============================================================================
   SUPER TicTacToe (as before; meta routing)
============================================================================= */

type Micro = { board: Cell[]; winner: Player | null; is_draw: boolean };
type SuperState = {
  id: string;
  micro: Micro[];
  macro: Cell[];
  target_macro_index: number | null;
  macro_winner: Player | null;
  macro_is_draw: boolean;
  status: string;
};

let SUPER_STATE: SuperState;

const posLabel = (i: number) => {
  const rows = ["top", "middle", "bottom"];
  const cols = ["left", "center", "right"];
  return `${rows[Math.floor(i / 3)]}-${cols[i % 3]}`;
};

const freshSuper = (): SuperState => ({
  id: `SUPER-${Date.now()}`,
  micro: Array.from({ length: 9 }, () => ({
    board: Array<Cell>(9).fill(null),
    winner: null,
    is_draw: false,
  })),
  macro: Array<Cell>(9).fill(null),
  target_macro_index: null,
  macro_winner: null,
  macro_is_draw: false,
  status: "choose any board",
});

const superHandlers = [
  http.post("http://localhost:8000/super/new", () => {
    SUPER_STATE = freshSuper();
    return HttpResponse.json(SUPER_STATE);
  }),

  http.post("http://localhost:8000/super/:id/move", async ({ request }) => {
    const { player, macro_index, cell_index } = (await request.json()) as {
      player: Player; macro_index: number; cell_index: number;
    };

    const mb = SUPER_STATE.micro[macro_index];
    if (!mb || mb.winner || mb.is_draw || mb.board[cell_index] !== null) {
      return HttpResponse.json({ detail: "Illegal move" }, { status: 400 });
    }

    // apply move to micro
    mb.board = mb.board.slice();
    mb.board[cell_index] = player;

    // resolve micro
    const w = win3(mb.board);
    if (w) mb.winner = w;
    else if (mb.board.every((c) => c !== null)) mb.is_draw = true;

    // macro projection + result
    SUPER_STATE.macro = SUPER_STATE.micro.map((m) => (m.winner ? m.winner : null));
    const macroWin = win3(SUPER_STATE.macro as Cell[]);
    SUPER_STATE.macro_winner = macroWin;
    SUPER_STATE.macro_is_draw =
      !macroWin && SUPER_STATE.micro.every((m) => m.winner || m.is_draw);

    // routing: next target = last cell unless that micro is closed
    const dest = SUPER_STATE.micro[cell_index];
    SUPER_STATE.target_macro_index =
      macroWin || SUPER_STATE.macro_is_draw ? null :
      dest.winner || dest.is_draw ? null : cell_index;

    SUPER_STATE.status =
      macroWin ? `${macroWin} wins` :
      SUPER_STATE.macro_is_draw ? "draw" :
      SUPER_STATE.target_macro_index === null ? "choose any board" :
      `play in the ${posLabel(SUPER_STATE.target_macro_index)} board`;

    return HttpResponse.json(SUPER_STATE);
  }),
];

/* =============================================================================
   MSW server
============================================================================= */
export const server = setupServer(...classicHandlers, ...superHandlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());


