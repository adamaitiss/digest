import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
  it("renders the training screen with demo data when Supabase config is absent", async () => {
    render(<App />);

    expect(await screen.findByText("Train")).toBeInTheDocument();
    expect(await screen.findByText(/Fed signals caution/)).toBeInTheDocument();
  });
});

