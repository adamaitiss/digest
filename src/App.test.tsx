import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import App, { AuthenticatedApp } from "./App";
import {
  demoCards,
  demoDigest,
  demoProfile,
  demoSaved,
  demoSources,
  demoTrainingSession
} from "./api/demoData";
import type { AppRepository, RepositorySnapshot } from "./types";

describe("App", () => {
  it("renders the training screen with demo data when Supabase config is absent", async () => {
    render(<App />);

    expect(await screen.findByText("Train")).toBeInTheDocument();
    expect(await screen.findByText(/Fed signals caution/)).toBeInTheDocument();
  });

  it("advances the training card before the reaction write resolves", async () => {
    let resolveReaction: () => void = () => undefined;
    const recordReaction = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveReaction = resolve;
        })
    );
    const repository = createRepository({ recordReaction });

    render(<AuthenticatedApp repository={repository} />);

    expect(await screen.findByText(/Fed signals caution/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Like/ }));

    expect(await screen.findByText(/EU adopts AI Act/)).toBeInTheDocument();
    expect(recordReaction).toHaveBeenCalledWith(expect.objectContaining({ cardId: "card-fed-rate" }), "interesting");
    expect(repository.loadSnapshot).toHaveBeenCalledTimes(1);

    resolveReaction();
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

function createRepository(overrides: Partial<AppRepository> = {}): AppRepository {
  return {
    mode: "demo",
    getCurrentUser: vi.fn(),
    sendMagicLink: vi.fn(),
    signOut: vi.fn(),
    loadSnapshot: vi.fn().mockResolvedValue(createSnapshot()),
    updateProfile: vi.fn(),
    recordReaction: vi.fn(),
    recordOpenSummary: vi.fn(),
    undoLastReaction: vi.fn(),
    saveCard: vi.fn(),
    unsaveItem: vi.fn(),
    recordDigestFeedback: vi.fn(),
    resetLearnedPreferences: vi.fn(),
    exportUserData: vi.fn(),
    ...overrides
  } as AppRepository;
}
