import React from "react";

type Player = "X" | "O";
type Cell = Player | null;

type Props = {
  player: Player; // supplied by parent (App)
  compact?: boolean; // hide status + New Game in microboards
  className?: string;
  onWin?: (winner: Player | "draw" | null) => void;
  onStateChange?: (dto: GameStateDTO) => void;
};

// ----- Backend DTOs -----
type GameStateDTO = {
  id: string;
  board: Cell[];
  winner: Player | null;
  is_draw: boolean;
  status: string; // backend text (e.g., "in progress", "X wins", "draw")
};

// Prefer env, fallback to localhost:8000
const API_BASE =
  (import.meta as any)?.env?.VITE_API_URL?.replace(/\/$/, "") ??
  "http://localhost:8000";

export default function TicTacToe({
  player,
  compact = false,
  className = "",
  onWin,
  onStateChange,
}: Props) {
  const [state, setState] = React.useState<GameStateDTO | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Create a new game on mount
  React.useEffect(() => {
    let canceled = false;
    async function start() {
      setError(null);
      setLoading(true);
      try {
        const r = await fetch(`${API_BASE}/tictactoe/new`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}), // turn-agnostic
        });
        if (!r.ok) throw new Error(`Create failed: ${r.status}`);
        const gs = (await r.json()) as GameStateDTO;
        if (!canceled) {
          setState(gs);
          onStateChange?.(gs);
        }
      } catch (e: any) {
        if (!canceled) setError(e?.message ?? "Failed to start game");
      } finally {
        if (!canceled) setLoading(false);
      }
    }
    start();
    return () => {
      canceled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Notify parent when result changes
  React.useEffect(() => {
    if (!state) return;
    onStateChange?.(state);
    if (state.winner) onWin?.(state.winner);
    else if (state.is_draw) onWin?.("draw");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.winner, state?.is_draw, state?.board]);

  async function playMove(index: number): Promise<GameStateDTO> {
    if (!state) throw new Error("No game");
    const r = await fetch(`${API_BASE}/tictactoe/${state.id}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ index, player }), // pass acting player
    });
    if (!r.ok) {
      const detail = await r.json().catch(() => ({}));
      throw new Error(detail?.detail ?? `Move failed: ${r.status}`);
    }
    return r.json();
  }

  async function handleClick(i: number) {
    if (!state || loading) return;
    if (state.winner || state.is_draw || state.board[i] !== null) return;

    setLoading(true);
    setError(null);
    try {
      const next = await playMove(i);
      setState(next);
      onStateChange?.(next);
    } catch (e: any) {
      setError(e?.message ?? "Move failed");
    } finally {
      setLoading(false);
    }
  }

  async function reset() {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${API_BASE}/tictactoe/new`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!r.ok) throw new Error(`Create failed: ${r.status}`);
      const gs = (await r.json()) as GameStateDTO;
      setState(gs);
      onStateChange?.(gs);
    } catch (e: any) {
      setError(e?.message ?? "Failed to reset");
    } finally {
      setLoading(false);
    }
  }

  // --- UI ---

  if (error) {
    return (
      <div className={["p-2", className].join(" ")}>
        <div className="mb-2 text-red-600 font-semibold text-sm">
          Error: {error}
        </div>
        {/* Keep Retry visible even in compact mode: rare & useful */}
        <button
          className="rounded-2xl px-3 py-1 border text-sm"
          onClick={reset}
          disabled={loading}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!state) {
    return <div className={["p-2 text-center", className].join(" ")}>Loading…</div>;
  }

  const { board, status } = state;

  return (
    <div className={["p-2", className].join(" ")}>
      {!compact && (
        <div className="text-center mb-2 text-xl font-semibold">{status}</div>
      )}
      <div className="grid grid-cols-3 gap-2">
        {board.map((c, i) => (
          <button
            key={i}
            className="aspect-square rounded-2xl border text-3xl font-bold flex items-center justify-center disabled:opacity-50"
            onClick={() => handleClick(i)}
            aria-label={`cell-${i}`}
            disabled={loading || c !== null || state.winner !== null || state.is_draw}
            title={c ?? player}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Hide the per-board New Game in compact mode */}
      {!compact && (
        <div className="text-center mt-3">
          <button
            className="rounded-2xl px-4 py-2 border"
            onClick={reset}
            disabled={loading}
          >
            New Game
          </button>
        </div>
      )}
    </div>
  );
}
