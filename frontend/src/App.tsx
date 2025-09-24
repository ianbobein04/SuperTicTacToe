// src/App.tsx
import React from "react";
import TicTacToe from "@/components/TicTacToe";

type Player = "X" | "O";
type Cell = Player | null;

type MicroSnapshot = {
  board: Cell[];
  winner: Player | null;
  is_draw: boolean;
};

type ChildDTO = {
  board: Cell[];
  winner: Player | null;
  is_draw: boolean;
};

const WIN_LINES: [number, number, number][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function posLabel(i: number): string {
  const rows = ["top", "middle", "bottom"];
  const cols = ["left", "center", "right"];
  return `${rows[Math.floor(i / 3)]}-${cols[i % 3]}`;
}

function projectMacro(micro: MicroSnapshot[]): Cell[] {
  // Macro cell = winner X/O of the microboard, else null (unclaimed or draw)
  return micro.map((m) => (m.winner ? m.winner : null));
}

function computeMacroWinner(macro: Cell[]): Player | null {
  for (const [a, b, c] of WIN_LINES) {
    const v = macro[a];
    if (v && v === macro[b] && v === macro[c]) return v;
  }
  return null;
}

function allMicroClosed(micro: MicroSnapshot[]): boolean {
  return micro.every((m) => m.winner !== null || m.is_draw);
}

function findDeltaIndex(prev: Cell[], next: Cell[]): number {
  for (let i = 0; i < 9; i++) {
    if (prev[i] !== next[i]) return i;
  }
  return -1;
}

export default function App() {
  // Global (meta) state
  const [player, setPlayer] = React.useState<Player>("X");
  const [micro, setMicro] = React.useState<MicroSnapshot[]>(
    Array.from({ length: 9 }, () => ({
      board: Array<Cell>(9).fill(null),
      winner: null,
      is_draw: false,
    }))
  );
  const [targetMacroIndex, setTargetMacroIndex] = React.useState<number | null>(null);
  const [macroWinner, setMacroWinner] = React.useState<Player | null>(null);
  const [macroDraw, setMacroDraw] = React.useState(false);
  const [resetNonce, setResetNonce] = React.useState(0); // forces microboards to remount on reset

  // Status text combines local player with routing hint
  const statusText = React.useMemo(() => {
    if (macroWinner) return `${macroWinner} wins`;
    if (macroDraw) return "draw";
    const hint =
      targetMacroIndex === null
        ? "choose any board"
        : `play in the ${posLabel(targetMacroIndex)} board`;
    return `${player}'s turn — ${hint}`;
  }, [macroWinner, macroDraw, targetMacroIndex, player]);

  // Compute and set macro results + next routing target after a child changes
  function applyMetaAfterChildChange(
    macroIdx: number,
    oldSnap: MicroSnapshot,
    newSnap: MicroSnapshot
  ) {
    // Was a new mark just placed on that micro?
    const prevCount = oldSnap.board.filter(Boolean).length;
    const nextCount = newSnap.board.filter(Boolean).length;
    const placed = nextCount === prevCount + 1;

    // If placed, find which cell was played (delta)
    let routedTarget = targetMacroIndex;
    if (placed) {
      const deltaCell = findDeltaIndex(oldSnap.board, newSnap.board);
      if (deltaCell >= 0) {
        // Default routing: next target is the cell index we just played
        routedTarget = deltaCell;
      }
    }

    // Recompute macro projection & results from updated micro
    const newMicro = micro.slice();
    newMicro[macroIdx] = newSnap;

    const macro = projectMacro(newMicro);
    const winner = computeMacroWinner(macro);
    const draw = !winner && allMicroClosed(newMicro);

    // If the routed destination micro is closed, free choice
    if (routedTarget !== null) {
      const dest = newMicro[routedTarget];
      if (!dest || dest.winner || dest.is_draw) {
        routedTarget = null;
      }
    }

    // If macro finished, clear routing
    if (winner || draw) {
      routedTarget = null;
    }

    // Commit everything
    setMicro(newMicro);
    setMacroWinner(winner);
    setMacroDraw(draw);
    setTargetMacroIndex(routedTarget);

    // Flip player only when a move was actually placed and macro not finished
    if (placed && !winner && !draw) {
      setPlayer((p) => (p === "X" ? "O" : "X"));
    }
  }

  // Child pushes its full state snapshot after any change (including initial mount)
  function handleStateChange(macroIdx: number, dto: ChildDTO) {
    const oldSnap = micro[macroIdx];
    const newSnap: MicroSnapshot = {
      board: dto.board,
      winner: dto.winner,
      is_draw: dto.is_draw,
    };
    applyMetaAfterChildChange(macroIdx, oldSnap, newSnap);
  }

  // Optional: explicit end notification (winner | "draw")
  function handleMicroEnd(macroIdx: number, result: Player | "draw") {
    const oldSnap = micro[macroIdx];
    const newSnap: MicroSnapshot = {
      board: oldSnap.board.slice(), // board already updated by onStateChange path
      winner: result === "draw" ? null : (result as Player),
      is_draw: result === "draw",
    };
    applyMetaAfterChildChange(macroIdx, oldSnap, newSnap);
  }

  // Reset the whole super game (remount children to POST /new)
  function resetSuper() {
    setPlayer("X");
    setMacroWinner(null);
    setMacroDraw(false);
    setTargetMacroIndex(null);
    setMicro(
      Array.from({ length: 9 }, () => ({
        board: Array<Cell>(9).fill(null),
        winner: null,
        is_draw: false,
      }))
    );
    setResetNonce((n) => n + 1); // microboards get new keys → remount → new backend games
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Status */}
      <div className="text-center mb-3 text-xl font-semibold">{statusText}</div>

      {/* Macro grid of 9 microboards */}
      <div className="grid grid-cols-3 gap-3">
        {micro.map((snap, macroIdx) => {
          const isClosed = snap.winner !== null || snap.is_draw;
          const selectable =
            macroWinner !== null ||
            macroDraw ||
            targetMacroIndex === null ||
            targetMacroIndex === macroIdx;

          return (
            <div
              key={`${macroIdx}-${resetNonce}`}
              aria-label={`macro-${macroIdx}`}
              className={[
                "relative rounded-2xl border p-2",
                selectable ? "" : "opacity-60 pointer-events-none",
                isClosed ? "bg-gray-50" : "",
              ].join(" ")}
            >
              {/* Overlay winner/draw badge on closed microboards */}
              {isClosed && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-5xl font-black opacity-20 select-none">
                    {snap.winner ? snap.winner : "·"}
                  </div>
                </div>
              )}

              <TicTacToe
                player={player}
                compact
                className="p-1"
                onStateChange={(dto) => handleStateChange(macroIdx, dto as ChildDTO)}
                onWin={(w) => {
                  if (!w) return;
                  handleMicroEnd(macroIdx, w as Player | "draw");
                }}
              />

              {/* Corner label for orientation */}
              <div className="absolute top-1 right-2 text-xs text-gray-500">
                {posLabel(macroIdx).replace("-", " ")}
              </div>
            </div>
          );
        })}
      </div>

      {/* Super controls */}
      <div className="text-center mt-4 space-x-2">
        <button className="rounded-2xl px-4 py-2 border" onClick={resetSuper}>
          New Super Game
        </button>
        <span className="text-sm text-gray-500 align-middle">
          Player: <b>{player}</b>
        </span>
      </div>
    </div>
  );
}
