import { useEffect, useMemo, useState } from "react";
import { AppShell, type AppTab } from "./components/AppShell";
import { AuthGate } from "./components/AuthGate";
import { DigestScreen } from "./components/DigestScreen";
import { ProfileScreen } from "./components/ProfileScreen";
import { SavedScreen } from "./components/SavedScreen";
import { StatusMessage } from "./components/StatusMessage";
import { TrainScreen } from "./components/TrainScreen";
import { getRepository } from "./api/repository";
import type { DigestFeedback, DigestItem, ReactionType, RepositorySnapshot, TrainingCard } from "./types";

export default function App() {
  const repository = useMemo(() => getRepository(), []);

  return (
    <AuthGate repository={repository}>
      {() => <AuthenticatedApp repository={repository} />}
    </AuthGate>
  );
}

interface AuthenticatedAppProps {
  repository: ReturnType<typeof getRepository>;
}

function AuthenticatedApp({ repository }: AuthenticatedAppProps) {
  const [activeTab, setActiveTab] = useState<AppTab>("train");
  const [snapshot, setSnapshot] = useState<RepositorySnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    const nextSnapshot = await repository.loadSnapshot();
    setSnapshot(nextSnapshot);
  }

  useEffect(() => {
    let active = true;
    repository
      .loadSnapshot()
      .then((nextSnapshot) => {
        if (active) {
          setSnapshot(nextSnapshot);
        }
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(caught instanceof Error ? caught.message : "Could not load app data.");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [repository]);

  async function runAction(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      await reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  async function onReact(card: TrainingCard, reaction: ReactionType) {
    await runAction(() => repository.recordReaction(card, reaction));
  }

  async function onUndo() {
    await runAction(() => repository.undoLastReaction());
  }

  async function onFeedback(item: DigestItem, feedback: DigestFeedback) {
    await runAction(() => repository.recordDigestFeedback(item, feedback));
  }

  async function onUpdateProfile(description: string) {
    await runAction(async () => {
      await repository.updateProfile(description);
    });
  }

  async function onUnsave(savedItemId: string) {
    await runAction(() => repository.unsaveItem(savedItemId));
  }

  async function onSignOut() {
    setBusy(true);
    await repository.signOut();
    window.location.reload();
  }

  return (
    <AppShell activeTab={activeTab} onTabChange={setActiveTab}>
      {loading ? (
        <main className="flex min-h-full items-center justify-center px-5 text-sm text-graphite">
          Loading...
        </main>
      ) : null}

      {!loading && !snapshot ? (
        <main className="px-5 py-6">
          <StatusMessage title="Could not load digest data" body={error ?? "Try refreshing the app."} />
        </main>
      ) : null}

      {snapshot ? (
        <>
          {error ? (
            <div className="fixed left-1/2 top-4 z-50 w-[calc(100%-32px)] max-w-[398px] -translate-x-1/2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-negative">
              {error}
            </div>
          ) : null}
          {activeTab === "train" ? (
            <TrainScreen snapshot={snapshot} busy={busy} onReact={onReact} onUndo={onUndo} />
          ) : null}
          {activeTab === "digest" ? (
            <DigestScreen snapshot={snapshot} busy={busy} onFeedback={onFeedback} />
          ) : null}
          {activeTab === "saved" ? (
            <SavedScreen snapshot={snapshot} busy={busy} onUnsave={onUnsave} />
          ) : null}
          {activeTab === "profile" ? (
            <ProfileScreen
              snapshot={snapshot}
              busy={busy}
              onUpdateProfile={onUpdateProfile}
              onSignOut={onSignOut}
            />
          ) : null}
        </>
      ) : null}
    </AppShell>
  );
}

