import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  demoCards,
  demoDigest,
  demoProfile,
  demoSaved,
  demoSources,
  demoTrainingSession
} from "../api/demoData";
import type { RepositorySnapshot } from "../types";
import { ProfileScreen } from "./ProfileScreen";

describe("ProfileScreen", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders reset and export controls without fake source tabs", () => {
    renderProfile();

    expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export" })).toBeInTheDocument();
    expect(screen.queryByText("Sources")).not.toBeInTheDocument();
  });

  it("confirms before resetting learned preferences and exports on request", () => {
    const onResetLearnedPreferences = vi.fn().mockResolvedValue(undefined);
    const onExportData = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(window, "confirm").mockReturnValue(true);

    renderProfile({ onResetLearnedPreferences, onExportData });

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    fireEvent.click(screen.getByRole("button", { name: "Export" }));

    expect(onResetLearnedPreferences).toHaveBeenCalledTimes(1);
    expect(onExportData).toHaveBeenCalledTimes(1);
  });
});

function renderProfile(
  overrides: Partial<ComponentProps<typeof ProfileScreen>> = {}
) {
  return render(
    <ProfileScreen
      snapshot={createSnapshot()}
      busy={false}
      onUpdateProfile={vi.fn()}
      onResetLearnedPreferences={vi.fn()}
      onExportData={vi.fn()}
      onSignOut={vi.fn()}
      {...overrides}
    />
  );
}

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
