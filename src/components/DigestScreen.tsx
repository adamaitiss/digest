import { Bookmark, ChevronDown, ExternalLink, ThumbsDown, ThumbsUp } from "lucide-react";
import { useMemo, useState } from "react";
import { formatRelativeTime } from "../lib/date";
import type { DigestFeedback, DigestItem, RepositorySnapshot } from "../types";
import { StatusMessage } from "./StatusMessage";

interface DigestScreenProps {
  snapshot: RepositorySnapshot;
  busy: boolean;
  onFeedback(item: DigestItem, feedback: DigestFeedback): Promise<void>;
}

const feedbackOptions: { value: DigestFeedback; label: string }[] = [
  { value: "useful", label: "Useful" },
  { value: "important", label: "Important" },
  { value: "duplicate", label: "Duplicate" },
  { value: "too_shallow", label: "Too shallow" },
  { value: "already_knew", label: "Already knew" }
];

export function DigestScreen({ snapshot, busy, onFeedback }: DigestScreenProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const digest = snapshot.digest;

  const grouped = useMemo(() => {
    const groups = new Map<string, DigestItem[]>();
    for (const item of digest?.items ?? []) {
      const items = groups.get(item.groupName) ?? [];
      items.push(item);
      groups.set(item.groupName, items);
    }
    return Array.from(groups.entries());
  }, [digest]);

  return (
    <main className="min-h-full bg-white">
      <header className="sticky top-0 z-20 border-b border-line bg-white px-5 pb-3 pt-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-ink">Digest</h1>
          <span className="text-xs font-semibold text-graphite">Today</span>
        </div>
        {digest ? (
          <div className="mt-3 flex items-center justify-between text-xs text-graphite">
            <span>
              {digest.itemCount} items across {grouped.length} topics
            </span>
            <span>Updated {formatRelativeTime(digest.generatedAt)}</span>
          </div>
        ) : null}
      </header>

      <section className="px-5 py-4">
        {!digest ? (
          <StatusMessage
            title="Digest not ready"
            body="The scheduled generator has not produced today's digest yet. This should not depend on training completion."
          />
        ) : null}

        {digest?.status === "failed" ? (
          <StatusMessage title="Digest generation failed" body="Open Sources to inspect the latest job run." />
        ) : null}

        {digest?.status === "ready" ? (
          <div className="space-y-5">
            <div className="rounded-lg border border-line bg-panel p-3 text-xs leading-5 text-graphite">
              Training status: <span className="font-semibold text-ink">{digest.trainingStatus}</span>
              {digest.costEstimateUsd ? (
                <span> · AI cost: ${digest.costEstimateUsd.toFixed(2)}</span>
              ) : null}
            </div>
            {grouped.map(([groupName, items]) => (
              <section key={groupName}>
                <div className="mb-2 flex items-center justify-between border-y border-line bg-panel px-2 py-2">
                  <h2 className="text-sm font-semibold text-ink">{groupName}</h2>
                  <span className="text-xs text-graphite">{items.length} items</span>
                </div>
                <div className="divide-y divide-line">
                  {items.map((item) => {
                    const isOpen = expanded === item.id;
                    return (
                      <article key={item.id} className="py-3">
                        <button
                          type="button"
                          className="flex w-full gap-3 text-left"
                          onClick={() => setExpanded(isOpen ? null : item.id)}
                        >
                          <span className="w-8 shrink-0 text-xs text-graphite">
                            {formatRelativeTime(item.publishedAt)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[15px] font-semibold leading-5 text-ink">
                              {item.title}
                            </span>
                            <span className="mt-1 block text-xs text-graphite">
                              {item.sourceLinks[0]?.sourceName ?? "Source"} · {item.language.toUpperCase()} ·{" "}
                              {item.confidenceNote}
                            </span>
                          </span>
                          <ChevronDown
                            aria-hidden="true"
                            className={`mt-1 shrink-0 text-graphite transition-transform ${
                              isOpen ? "rotate-180" : ""
                            }`}
                            size={18}
                          />
                        </button>
                        {isOpen ? (
                          <div className="ml-11 mt-3 space-y-3 text-sm leading-6 text-graphite">
                            <p className="text-ink">{item.summary}</p>
                            <div>
                              <p className="font-semibold text-ink">Why it matters</p>
                              <p>{item.whyItMatters}</p>
                            </div>
                            <div>
                              <p className="font-semibold text-ink">Why selected</p>
                              <p>{item.whySelected}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {item.sourceLinks.map((link) => (
                                <a
                                  key={`${item.id}-${link.url}`}
                                  href={link.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex min-h-8 items-center gap-1 rounded-md border border-line px-2 text-xs font-semibold"
                                >
                                  {link.sourceName}
                                  <ExternalLink aria-hidden="true" size={13} />
                                </a>
                              ))}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {feedbackOptions.map((option) => (
                                <button
                                  key={option.value}
                                  type="button"
                                  disabled={busy}
                                  onClick={() => void onFeedback(item, option.value)}
                                  className={`min-h-8 rounded-md border px-2 text-xs font-semibold ${
                                    item.feedbackStatus === option.value
                                      ? "border-action bg-action text-white"
                                      : "border-line text-graphite"
                                  }`}
                                >
                                  {option.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}

export function DigestQuickActions() {
  return (
    <div className="flex items-center gap-2 text-graphite">
      <ThumbsUp aria-hidden="true" size={17} className="text-positive" />
      <ThumbsDown aria-hidden="true" size={17} className="text-negative" />
      <Bookmark aria-hidden="true" size={17} />
    </div>
  );
}

