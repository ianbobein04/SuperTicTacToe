import { describe, expect, it } from "vitest";
import React from "react";
import { render, screen, fireEvent, within, waitFor } from "@testing-library/react";
import App from "@/App";

describe("Super TicTacToe <App /> (meta-routing over 9 classic boards)", () => {
  it("creates 9 games and shows initial meta status", async () => {
    render(<App />);
    expect(await screen.findByText(/X's turn — choose any board/i)).toBeInTheDocument();
    // sanity: we have 9 macro boards
    for (let i = 0; i < 9; i++) {
      expect(screen.getByLabelText(`macro-${i}`)).toBeInTheDocument();
    }
  });

  it("routes next move to the clicked cell's macro board", async () => {
    render(<App />);
    await screen.findByText(/choose any board/i);

    // Click macro-0, cell-8
    const m0 = screen.getByLabelText("macro-0");
    const m0c8 = within(m0).getByLabelText("cell-8");
    fireEvent.click(m0c8);

    // App should announce the routed target board (macro index 8)
    expect(await screen.findByText(/play in the bottom-right board/i)).toBeInTheDocument();

    // Try clicking a non-target macro (macro-1) → should do nothing (cell stays empty)
    const m1 = screen.getByLabelText("macro-1");
    const m1c0 = within(m1).getByLabelText("cell-0");
    expect(m1c0).toHaveTextContent(""); // still empty
    fireEvent.click(m1c0);

    // Allow React + fetch guards to flush; the cell should still be empty (no illegal move)
    await waitFor(() => {
      expect(m1c0).toHaveTextContent("");
    });

    // Clicking inside the routed macro (macro-8) should work
    const m8 = screen.getByLabelText("macro-8");
    const m8c4 = within(m8).getByLabelText("cell-4");
    fireEvent.click(m8c4);

    // After a legal move the cell should show a mark (X or O, depending on local player flip)
    await waitFor(() => {
      expect(m8c4.textContent === "X" || m8c4.textContent === "O").toBe(true);
    });
  });

  it("resets all microboards with 'New Super Game'", async () => {
    render(<App />);
    await screen.findByText(/choose any board/i);

    // Make a move somewhere to mark the board
    const m0 = screen.getByLabelText("macro-0");
    const m0c0 = within(m0).getByLabelText("cell-0");
    fireEvent.click(m0c0);
    await waitFor(() => {
      expect(m0c0.textContent === "X" || m0c0.textContent === "O").toBe(true);
    });

    // Reset the whole meta game
    const resetBtn = screen.getByRole("button", { name: /new super game/i });
    fireEvent.click(resetBtn);

    // Back to initial status
    await screen.findByText(/X's turn — choose any board/i);

    // Spot-check a few cells are cleared (avoid global 'X' from the "Player: X" badge)
    const sampleMacros = [0, 4, 8];
    for (const mi of sampleMacros) {
      const macro = screen.getByLabelText(`macro-${mi}`);
      for (const ci of [0, 4, 8]) {
        const cell = within(macro).getByLabelText(`cell-${ci}`);
        expect(cell).toHaveTextContent("");
      }
    }
  });
});
