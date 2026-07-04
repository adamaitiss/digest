import type { SupabaseClient } from "@supabase/supabase-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createSupabaseRepository } from "./supabaseRepository";

describe("createSupabaseRepository", () => {
  afterEach(() => {
    window.history.replaceState(null, document.title, "/");
  });

  it("hydrates a session from an implicit Supabase redirect hash before reading the user", async () => {
    const setSession = vi.fn().mockResolvedValue({ error: null });
    const getUser = vi.fn().mockResolvedValue({
      data: { user: { id: "user-1", email: "smoke@example.com" } },
      error: null
    });
    const client = {
      auth: {
        setSession,
        getUser
      }
    } as unknown as SupabaseClient;

    window.history.replaceState(
      null,
      document.title,
      "/digest/?smoke_auth=1#access_token=access-1&refresh_token=refresh-1&type=magiclink"
    );

    const repository = createSupabaseRepository(client);
    const user = await repository.getCurrentUser();

    expect(setSession).toHaveBeenCalledWith({
      access_token: "access-1",
      refresh_token: "refresh-1"
    });
    expect(getUser).toHaveBeenCalled();
    expect(user).toEqual({ id: "user-1", email: "smoke@example.com" });
    expect(window.location.hash).toBe("");
  });
});
