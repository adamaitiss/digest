import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AuthGate } from "./AuthGate";
import type { AppRepository, SessionUser } from "../types";

vi.mock("../config", () => ({
  appConfig: { useDemoData: false },
  hasSupabaseConfig: true
}));

function createRepository(): {
  repository: AppRepository;
  emitAuthChange(user: SessionUser | null): void;
} {
  let listener: ((user: SessionUser | null) => void) | null = null;

  return {
    repository: {
      mode: "supabase",
      getCurrentUser: vi.fn().mockResolvedValue(null),
      onAuthStateChange(callback: (user: SessionUser | null) => void) {
        listener = callback;
        return () => {
          listener = null;
        };
      },
      sendMagicLink: vi.fn(),
      signOut: vi.fn(),
      loadSnapshot: vi.fn(),
      updateProfile: vi.fn(),
      recordReaction: vi.fn(),
      undoLastReaction: vi.fn(),
      saveCard: vi.fn(),
      unsaveItem: vi.fn(),
      recordDigestFeedback: vi.fn()
    } as unknown as AppRepository,
    emitAuthChange(user: SessionUser | null) {
      listener?.(user);
    }
  };
}

describe("AuthGate", () => {
  it("renders authenticated content after a delayed auth state change", async () => {
    const { repository, emitAuthChange } = createRepository();

    render(
      <AuthGate repository={repository}>
        {(user) => <div>{user ? `Signed in as ${user.email}` : "No user"}</div>}
      </AuthGate>
    );

    expect(await screen.findByRole("button", { name: "Send magic link" })).toBeInTheDocument();

    act(() => {
      emitAuthChange({ id: "user-1", email: "smoke@example.com" });
    });

    expect(await screen.findByText("Signed in as smoke@example.com")).toBeInTheDocument();
  });
});
