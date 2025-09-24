import { describe, expect, it, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import TicTacToe from "../components/TicTacToe";

describe("TicTacToe component (turn-agnostic API via MSW)", () => {
  it("plays a simple X-only game and declares winner", async () => {
    const onWin = vi.fn();
    render(<TicTacToe onWin={onWin} />);

    // Wait for game creation
    await screen.findByLabelText("cell-0");

    // X clicks 0,1,2 (turn-agnostic handler accepts X-only)
    fireEvent.click(screen.getByLabelText("cell-0"));
    await waitFor(() => expect(screen.getByLabelText("cell-0")).toHaveTextContent("X"));

    fireEvent.click(screen.getByLabelText("cell-1"));
    await waitFor(() => expect(screen.getByLabelText("cell-1")).toHaveTextContent("X"));

    fireEvent.click(screen.getByLabelText("cell-2"));
    await waitFor(() => expect(screen.getByLabelText("cell-2")).toHaveTextContent("X"));

    expect(await screen.findByText(/X wins/i)).toBeInTheDocument();
    expect(onWin).toHaveBeenCalledWith("X");
  });

  it("prevents moves in occupied cells", async () => {
    render(<TicTacToe />);
    const c0 = await screen.findByLabelText("cell-0");

    fireEvent.click(c0);
    await waitFor(() => expect(c0).toHaveTextContent("X"));

    // Second click on same cell should be ignored (still "X")
    fireEvent.click(c0);
    await waitFor(() => expect(c0).toHaveTextContent("X"));
  });

  it("can start a new game after finishing", async () => {
    render(<TicTacToe />);
    await screen.findByLabelText("cell-0");

    // Win quickly with X-only clicks (await after each)
    fireEvent.click(screen.getByLabelText("cell-0"));
    await waitFor(() => expect(screen.getByLabelText("cell-0")).toHaveTextContent("X"));

    fireEvent.click(screen.getByLabelText("cell-1"));
    await waitFor(() => expect(screen.getByLabelText("cell-1")).toHaveTextContent("X"));

    fireEvent.click(screen.getByLabelText("cell-2"));
    await screen.findByText(/X wins/i);

    // New Game resets to blank board
    const newBtn = screen.getByRole("button", { name: /new game/i });
    fireEvent.click(newBtn);

    const c0 = await screen.findByLabelText("cell-0");
    expect(c0).toHaveTextContent("");
  });
});

