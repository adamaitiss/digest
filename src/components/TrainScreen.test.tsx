import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  demoCards,
  demoDigest,
  demoProfile,
  demoSaved,
  demoSources,
  demoTrainingSession
} from "../api/demoData";
import type { RepositorySnapshot } from "../types";
import { TrainScreen } from "./TrainScreen";

describe("TrainScreen", () => {
  it("records opening a card summary once without consuming the card", () => {
    const onOpenSummary = vi.fn().mockResolvedValue(undefined);

    render(
      <TrainScreen
        snapshot={createSnapshot()}
        busy={false}
        pendingWrites={0}
        onReact={vi.fn()}
        onOpenSummary={onOpenSummary}
        onUndo={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText(/Fed signals caution/).closest("button")!);
    expect(onOpenSummary).toHaveBeenCalledTimes(1);
    expect(onOpenSummary).toHaveBeenCalledWith(expect.objectContaining({ cardId: "card-fed-rate" }));

    fireEvent.click(screen.getByRole("button", { name: "Close summary" }));
    fireEvent.click(screen.getByText(/Fed signals caution/).closest("button")!);

    expect(onOpenSummary).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Fed signals caution/)).toBeInTheDocument();
  });
});

function createSnapshot(): RepositorySnapshot {
  return JSON.parse(
    JSON.stringify({
      profile: demoProfile,
      cards: demoCards,
      digest: demoDigest,
      saved: demoSaved,
      sources: demoSources,
      trainingSession: demoTrainingSession
    })
  ) as RepositorySnapshot;
}
