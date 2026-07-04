import { useEffect, useMemo, useRef, useState } from "react";
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

export function AuthenticatedApp({ repository }: AuthenticatedAppProps) {
  const [activeTab, setActiveTab] = useState<AppTab>("train");
  const [snapshot, setSnapshot] = useState<RepositorySnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [pendingTrainingWrites, setPendingTrainingWrites] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const pendingTrainingWritesRef = useRef(0);

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

  function changePendingTrainingWrites(delta: number) {
    pendingTrainingWritesRef.current = Math.max(0, pendingTrainingWritesRef.current + delta);
    setPendingTrainingWrites(pendingTrainingWritesRef.current);
  }

  function onReact(card: TrainingCard, reaction: ReactionType): Promise<void> {
    const currentSnapshot = snapshot;
    if (!currentSnapshot || !currentSnapshot.cards.some((candidate) => candidate.cardId === card.cardId)) {
      return Promise.resolve();
    }

    const reloadWhenSettled = currentSnapshot.cards.length <= 1;
    setError(null);
    setSnapshot((current) => {
      if (!current || !current.cards.some((candidate) => candidate.cardId === card.cardId)) {
        return current;
      }
      const remainingCards = current.cards.filter((candidate) => candidate.cardId !== card.cardId);
      return {
        ...current,
        cards: remainingCards,
        trainingSession: advanceTrainingSession(current.trainingSession, card, reaction)
      };
    });

    changePendingTrainingWrites(1);
    void repository
      .recordReaction(card, reaction)
      .then(async () => {
        if (reloadWhenSettled && pendingTrainingWritesRef.current === 1) {
          await reload();
        }
      })
      .catch(async (caught: unknown) => {
        setError(caught instanceof Error ? caught.message : "Could not save reaction.");
        try {
          await reload();
        } catch (reloadError) {
          setError(reloadError instanceof Error ? reloadError.message : "Could not reload app data.");
        }
      })
      .finally(() => {
        changePendingTrainingWrites(-1);
      });
    return Promise.resolve();
  }

  function onOpenSummary(card: TrainingCard): Promise<void> {
    void repository.recordOpenSummary(card).catch(() => undefined);
    return Promise.resolve();
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

  async function onResetLearnedPreferences() {
    await runAction(() => repository.resetLearnedPreferences().then(() => undefined));
  }

  async function onExportData() {
    setBusy(true);
    setError(null);
    try {
      const data = await repository.exportUserData();
      downloadJson(data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not export data.");
    } finally {
      setBusy(false);
    }
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
            <TrainScreen
              snapshot={snapshot}
              busy={busy}
              pendingWrites={pendingTrainingWrites}
              onReact={onReact}
              onOpenSummary={onOpenSummary}
              onUndo={onUndo}
            />
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
              onResetLearnedPreferences={onResetLearnedPreferences}
              onExportData={onExportData}
              onSignOut={onSignOut}
            />
          ) : null}
        </>
      ) : null}
    </AppShell>
  );
}

function advanceTrainingSession(
  session: RepositorySnapshot["trainingSession"],
  card: TrainingCard,
  reaction: ReactionType
): RepositorySnapshot["trainingSession"] {
  const cardsReactedTo = session.cardsReactedTo + 1;
  return {
    ...session,
    cardsShown: Math.max(session.cardsShown, cardsReactedTo),
    cardsReactedTo,
    positiveCount: isPositiveReaction(reaction) ? session.positiveCount + 1 : session.positiveCount,
    negativeCount: isNegativeReaction(reaction) ? session.negativeCount + 1 : session.negativeCount,
    savesCount: reaction === "save" ? session.savesCount + 1 : session.savesCount,
    explorationCardsShown:
      card.queueReason === "exploration" ? session.explorationCardsShown + 1 : session.explorationCardsShown,
    mustKnowCardsShown:
      card.queueReason === "must_know" ? session.mustKnowCardsShown + 1 : session.mustKnowCardsShown
  };
}

function isPositiveReaction(reaction: ReactionType): boolean {
  return ["interesting", "save", "show_more_like_this", "important_not_interesting"].includes(reaction);
}

function isNegativeReaction(reaction: ReactionType): boolean {
  return ["not_interesting", "too_obvious", "too_noisy", "hide_topic", "hide_source"].includes(reaction);
}

function downloadJson(data: Record<string, unknown>) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `digest-export-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
