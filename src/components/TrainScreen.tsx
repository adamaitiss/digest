import { Bookmark, Check, Eye, RotateCcw, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useDrag } from "@use-gesture/react";
import { formatRelativeTime } from "../lib/date";
import type { ReactionType, RepositorySnapshot, TrainingCard } from "../types";
import { StatusMessage } from "./StatusMessage";

interface TrainScreenProps {
  snapshot: RepositorySnapshot;
  busy: boolean;
  pendingWrites: number;
  onReact(card: TrainingCard, reaction: ReactionType): Promise<void>;
  onOpenSummary(card: TrainingCard): Promise<void>;
  onUndo(): Promise<void>;
}

const reasonLabel: Record<TrainingCard["queueReason"], string> = {
  predicted_relevant: "Predicted relevant",
  exploration: "Exploration",
  must_know: "Must know"
};

export function TrainScreen({ snapshot, busy, pendingWrites, onReact, onOpenSummary, onUndo }: TrainScreenProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [openedSummaryCardIds, setOpenedSummaryCardIds] = useState<Set<string>>(() => new Set());
  const card = snapshot.cards[0];

  const progress = useMemo(() => {
    const session = snapshot.trainingSession;
    return `${Math.min(session.cardsReactedTo + 1, session.targetCards)} / ${session.targetCards}`;
  }, [snapshot.trainingSession]);

  const bind = useDrag(
    ({ last, movement: [mx], velocity: [vx], cancel }) => {
      if (!card || busy || !last) {
        return;
      }
      if (Math.abs(mx) > 100 || vx > 0.45) {
        cancel();
        setDetailOpen(false);
        setMoreOpen(false);
        void onReact(card, mx > 0 ? "interesting" : "not_interesting");
      }
    },
    { axis: "x", pointer: { touch: true } }
  );

  async function react(reaction: ReactionType) {
    if (!card || busy) {
      return;
    }
    setDetailOpen(false);
    setMoreOpen(false);
    await onReact(card, reaction);
  }

  function toggleDetail() {
    if (!card) {
      return;
    }
    const willOpen = !detailOpen;
    setDetailOpen(willOpen);
    if (willOpen && !openedSummaryCardIds.has(card.cardId)) {
      setOpenedSummaryCardIds((current) => {
        const next = new Set(current);
        next.add(card.cardId);
        return next;
      });
      void onOpenSummary(card);
    }
  }

  return (
    <main className="min-h-full bg-white">
      <header className="sticky top-0 z-20 border-b border-line bg-white px-5 pb-3 pt-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-ink">Train</h1>
          <span className="text-sm font-semibold text-action">{progress}</span>
        </div>
        <div className="mt-3 h-1 rounded-full bg-panel">
          <div
            className="h-1 rounded-full bg-action"
            style={{
              width: `${Math.min(
                100,
                (snapshot.trainingSession.cardsReactedTo / snapshot.trainingSession.targetCards) * 100
              )}%`
            }}
          />
        </div>
      </header>

      <section className="px-5 pb-4 pt-5">
        {card ? (
          <article
            {...bind()}
            className="select-none rounded-lg border border-line bg-white p-4 shadow-sm"
            aria-label="Training card"
          >
            <button
              type="button"
              className="block w-full text-left"
              onClick={toggleDetail}
            >
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-graphite">
                <span>{card.sourceName}</span>
                <span aria-hidden="true">·</span>
                <span>{formatRelativeTime(card.publishedAt)}</span>
                <span aria-hidden="true">·</span>
                <span>{card.language.toUpperCase()}</span>
                <span aria-hidden="true">·</span>
                <span>{reasonLabel[card.queueReason]}</span>
              </div>
              <h2 className="mt-3 text-[26px] font-semibold leading-[1.12] text-ink">{card.headline}</h2>
              <p className="mt-4 text-base leading-6 text-graphite">{card.summary}</p>
              <div className="mt-4 flex items-center gap-2 text-sm font-medium text-action">
                <span>{new URL(card.sourceLink).hostname.replace(/^www\./, "")}</span>
                <Eye aria-hidden="true" size={16} />
              </div>
            </button>

            <div className="mt-4 border-t border-line pt-3">
              <button
                type="button"
                className="flex w-full items-center justify-between text-left"
                onClick={toggleDetail}
              >
                <span className="text-sm font-semibold text-ink">Why shown</span>
                <span className="text-lg leading-none text-graphite">{detailOpen ? "⌃" : "⌄"}</span>
              </button>
              <p className="mt-1 text-sm leading-5 text-graphite">{card.whyShown}</p>
            </div>

            {detailOpen ? (
              <div className="mt-4 rounded-lg border border-line bg-panel p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-base font-semibold text-ink">Summary</h3>
                  <button
                    type="button"
                    aria-label="Close summary"
                    className="rounded-md p-1 text-graphite"
                    onClick={() => setDetailOpen(false)}
                  >
                    <X aria-hidden="true" size={19} />
                  </button>
                </div>
                <p className="text-sm leading-6 text-ink">{card.summary}</p>
                <dl className="mt-4 grid grid-cols-1 gap-2 text-sm">
                  <div>
                    <dt className="font-semibold text-ink">Topic</dt>
                    <dd className="text-graphite">{card.topic}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-ink">Entities</dt>
                    <dd className="text-graphite">{card.entities.join(", ") || "None detected"}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-ink">Confidence</dt>
                    <dd className="text-graphite">{card.confidenceNote}</dd>
                  </div>
                </dl>
              </div>
            ) : null}
          </article>
        ) : (
          <StatusMessage
            title="Training complete"
            body="Today's card queue is empty. The digest is generated on schedule even if training is partial."
          />
        )}
      </section>

      <section className="sticky bottom-[74px] z-10 border-t border-line bg-white px-4 py-3">
        <div className="grid grid-cols-4 gap-2">
          <ReactionButton
            label="Reject"
            hint="Not relevant"
            icon={<X aria-hidden="true" size={26} />}
            tone="negative"
            disabled={!card || busy}
            onClick={() => void react("not_interesting")}
          />
          <ReactionButton
            label="Save"
            hint="For later"
            icon={<Bookmark aria-hidden="true" size={24} />}
            disabled={!card || busy}
            onClick={() => void react("save")}
          />
          <ReactionButton
            label="Like"
            hint="Useful"
            icon={<Check aria-hidden="true" size={26} />}
            tone="positive"
            disabled={!card || busy}
            onClick={() => void react("interesting")}
          />
          <ReactionButton
            label="Undo"
            hint="Last action"
            icon={<RotateCcw aria-hidden="true" size={23} />}
            disabled={busy || pendingWrites > 0}
            onClick={() => void onUndo()}
          />
        </div>
        <div className="mt-2">
          <button
            type="button"
            className="min-h-9 w-full rounded-md border border-line text-sm font-semibold text-graphite"
            disabled={!card || busy}
            onClick={() => setMoreOpen((open) => !open)}
          >
            More
          </button>
          {moreOpen ? (
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              {[
                ["important_not_interesting", "Important"],
                ["show_more_like_this", "More like this"],
                ["too_obvious", "Too obvious"],
                ["too_noisy", "Too noisy"],
                ["hide_topic", "Hide topic"],
                ["hide_source", "Hide source"]
              ].map(([reaction, label]) => (
                <button
                  key={reaction}
                  type="button"
                  className="min-h-9 rounded-md border border-line px-2 text-graphite"
                  onClick={() => void react(reaction as ReactionType)}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

interface ReactionButtonProps {
  label: string;
  hint: string;
  icon: React.ReactNode;
  tone?: "positive" | "negative" | "neutral";
  disabled?: boolean;
  onClick(): void;
}

function ReactionButton({ label, hint, icon, tone = "neutral", disabled, onClick }: ReactionButtonProps) {
  const toneClass =
    tone === "positive" ? "text-positive" : tone === "negative" ? "text-negative" : "text-ink";
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex min-h-[76px] flex-col items-center justify-center rounded-lg border border-line bg-white px-2 text-center disabled:opacity-45"
    >
      <span className={toneClass}>{icon}</span>
      <span className="mt-1 text-sm font-semibold text-ink">{label}</span>
      <span className="text-[11px] leading-4 text-graphite">{hint}</span>
    </button>
  );
}
