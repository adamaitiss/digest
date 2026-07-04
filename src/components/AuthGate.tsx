import { useEffect, useState } from "react";
import { Mail, ShieldCheck } from "lucide-react";
import { appConfig, hasSupabaseConfig } from "../config";
import type { AppRepository, SessionUser } from "../types";
import { StatusMessage } from "./StatusMessage";

interface AuthGateProps {
  repository: AppRepository;
  children: (user: SessionUser | null) => React.ReactNode;
}

export function AuthGate({ repository, children }: AuthGateProps) {
  const [email, setEmail] = useState("");
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const unsubscribe = repository.onAuthStateChange?.((nextUser) => {
      if (active) {
        setUser(nextUser);
        setLoading(false);
        setError(null);
      }
    });

    repository
      .getCurrentUser()
      .then((currentUser) => {
        if (active) {
          setUser(currentUser);
        }
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(caught instanceof Error ? caught.message : "Could not read auth state.");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [repository]);

  if (appConfig.useDemoData) {
    return children(user);
  }

  if (!hasSupabaseConfig) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-[430px] items-center px-5">
        <StatusMessage
          title="Backend not configured"
          body="Set the public Supabase URL and anon key before using the deployed app."
        />
      </main>
    );
  }

  if (loading) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-[430px] items-center px-5 text-sm text-graphite">
        Checking session...
      </main>
    );
  }

  if (user) {
    return children(user);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSent(false);
    try {
      await repository.sendMagicLink(email.trim());
      setSent(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not send magic link.");
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-[430px] flex-col justify-center px-5">
      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-lg border border-line bg-panel">
          <ShieldCheck aria-hidden="true" className="text-action" size={24} />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-0 text-ink">Personal News Swipe Digest</h1>
          <p className="text-sm text-graphite">Private magic-link access</p>
        </div>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <label className="block text-sm font-semibold text-ink" htmlFor="email">
          Email
        </label>
        <div className="flex items-center gap-2 rounded-lg border border-line px-3 py-2">
          <Mail aria-hidden="true" size={18} className="text-graphite" />
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="min-h-10 flex-1 border-0 bg-transparent text-base outline-none"
            placeholder="you@example.com"
          />
        </div>
        <button
          type="submit"
          className="min-h-11 w-full rounded-md bg-ink px-4 text-sm font-semibold text-white"
        >
          Send magic link
        </button>
      </form>
      {sent ? (
        <p className="mt-4 rounded-lg border border-line bg-panel px-3 py-3 text-sm text-graphite">
          Check your email on this iPhone and open the link to continue.
        </p>
      ) : null}
      {error ? <p className="mt-4 text-sm text-negative">{error}</p> : null}
    </main>
  );
}
