import "@testing-library/jest-dom";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

// Precomputed fixtures (no logic here, just snapshots)
const initial = {
  id: "TEST-1",
  board: [null,null,null,null,null,null,null,null,null],
  current_player: "X",
  winner: null,
  is_draw: false,
  status: "X's turn",
};

// Sequence used by your test: 0, 3, 1, 4, 2 → X wins
const script = [
  // after X plays 0
  {
    board: ["X",null,null, null,null,null, null,null,null],
    current_player: "O",
    winner: null,
    is_draw: false,
    status: "O's turn",
  },
  // after O plays 3
  {
    board: ["X",null,null, "O",null,null, null,null,null],
    current_player: "X",
    winner: null,
    is_draw: false,
    status: "X's turn",
  },
  // after X plays 1
  {
    board: ["X","X",null, "O",null,null, null,null,null],
    current_player: "O",
    winner: null,
    is_draw: false,
    status: "O's turn",
  },
  // after O plays 4
  {
    board: ["X","X",null, "O","O",null, null,null,null],
    current_player: "X",
    winner: null,
    is_draw: false,
    status: "X's turn",
  },
  // after X plays 2 → win
  {
    board: ["X","X","X", "O","O",null, null,null,null],
    current_player: "X", // value doesn’t matter post-win
    winner: "X",
    is_draw: false,
    status: "X wins",
  },
];

let step = -1;

export const server = setupServer(
  // Create game
  http.post("http://localhost:8000/tictactoe/new", async () => {
    step = -1;
    return HttpResponse.json(initial);
  }),

  // Make move
  http.post("http://localhost:8000/tictactoe/:id/move", async ({ request }) => {
    const { index } = await request.json();
    const expected = [0, 3, 1, 4, 2][step + 1]; // expected sequence
    if (index !== expected) {
      // simulate a backend validation error (no re-implementation of rules beyond the script)
      return HttpResponse.json(
        { detail: `Unexpected move: got ${index}, expected ${expected}` },
        { status: 400 }
      );
    }
    step += 1;
    const s = script[step];
    return HttpResponse.json({
      id: "TEST-1",
      ...s,
    });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
