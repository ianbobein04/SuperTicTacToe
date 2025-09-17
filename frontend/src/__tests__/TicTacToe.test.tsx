import { describe, expect, it, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import TicTacToe from "../components/TicTacToe";

describe("TicTacToe component (API via MSW)", () => {
  it("plays a simple game and declares winner", async () => {
    const onWin = vi.fn();
    render(<TicTacToe onWin={onWin} />);

    // Wait for game creation (MSW handles POST /tictactoe/new)
    await screen.findByLabelText("cell-0");

    // X 0, O 3, X 1, O 4, X 2 -> X wins (MSW script enforces this)
    fireEvent.click(screen.getByLabelText("cell-0"));
    await screen.findByText(/O's turn/i);   // wait until move resolved
    expect(screen.getByLabelText("cell-0")).toHaveTextContent("X");
    fireEvent.click(screen.getByLabelText("cell-3"));
    await screen.findByText(/X's turn/i);   // wait until move resolved
    expect(screen.getByLabelText("cell-3")).toHaveTextContent("O");
    fireEvent.click(screen.getByLabelText("cell-1"));
    await screen.findByText(/O's turn/i);   // wait until move resolved
    expect(screen.getByLabelText("cell-1")).toHaveTextContent("X");
    fireEvent.click(screen.getByLabelText("cell-4"));
    await screen.findByText(/X's turn/i);   // wait until move resolved
    expect(screen.getByLabelText("cell-4")).toHaveTextContent("O");
    fireEvent.click(screen.getByLabelText("cell-2"));
    await screen.findByText(/X's turn/i);   // wait until move resolved
    expect(screen.getByLabelText("cell-2")).toHaveTextContent("X");

    expect(await screen.findByText(/X wins/i)).toBeInTheDocument();
    expect(onWin).toHaveBeenCalledWith("X");
  });

  it("prevents moves in occupied cells", async () => {
    render(<TicTacToe />);
    const c0 = await screen.findByLabelText("cell-0");
    fireEvent.click(c0);
    await screen.findByText(/O's turn/i);   // wait until move resolved
    fireEvent.click(c0); // second click ignored/disabled
    await screen.findByText(/O's turn/i);   // wait until move resolved
    expect(c0.textContent).toBe("X");
  });

  it("can start a new game after finishing", async () => {
    render(<TicTacToe />);
    await screen.findByLabelText("cell-0");
    // play the same winning sequence
    fireEvent.click(screen.getByLabelText("cell-0"));
    await screen.findByText(/O's turn/i);   // wait until move resolved
    fireEvent.click(screen.getByLabelText("cell-3"));
    await screen.findByText(/X's turn/i);   // wait until move resolved
    fireEvent.click(screen.getByLabelText("cell-1"));
    await screen.findByText(/O's turn/i);   // wait until move resolved
    fireEvent.click(screen.getByLabelText("cell-4"));
    await screen.findByText(/X's turn/i);   // wait until move resolved
    fireEvent.click(screen.getByLabelText("cell-2"));

    expect(await screen.findByText(/X wins/i)).toBeInTheDocument();

    // Click "New Game" (component calls POST /tictactoe/new again)
    const newGameBtn = screen.getByRole("button", { name: /new game/i });
    fireEvent.click(newGameBtn);

    // board should be reset: cell-0 is empty again
    const c0 = await screen.findByLabelText("cell-0");
    expect(c0.textContent).toBe("");
  });
});
