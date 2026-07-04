import { Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { formatRelativeTime } from "../lib/date";
import type { RepositorySnapshot } from "../types";
import { StatusMessage } from "./StatusMessage";

interface SavedScreenProps {
  snapshot: RepositorySnapshot;
  busy: boolean;
  onUnsave(savedItemId: string): Promise<void>;
}

export function SavedScreen({ snapshot, busy, onUnsave }: SavedScreenProps) {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("All");

  const topics = useMemo(() => {
    const unique = new Set(snapshot.saved.map((item) => item.topic));
    return ["All", ...Array.from(unique).sort()];
  }, [snapshot.saved]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return snapshot.saved.filter((item) => {
      const topicMatch = topic === "All" || item.topic === topic;
      const queryMatch =
        !normalized ||
        item.title.toLowerCase().includes(normalized) ||
        item.sourceName.toLowerCase().includes(normalized);
      return topicMatch && queryMatch;
    });
  }, [query, snapshot.saved, topic]);

  return (
    <main className="min-h-full bg-white">
      <header className="sticky top-0 z-20 border-b border-line bg-white px-5 pb-3 pt-4">
        <h1 className="text-xl font-semibold text-ink">Saved</h1>
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-line px-3">
          <Search aria-hidden="true" size={18} className="text-graphite" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="min-h-10 min-w-0 flex-1 border-0 bg-transparent text-sm outline-none"
            placeholder="Search saved items"
          />
          <SlidersHorizontal aria-hidden="true" size={18} className="text-graphite" />
        </div>
        <div className="thin-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
          {topics.map((candidate) => (
            <button
              key={candidate}
              type="button"
              onClick={() => setTopic(candidate)}
              className={`min-h-9 shrink-0 rounded-md border px-3 text-sm font-semibold ${
                topic === candidate
                  ? "border-action bg-blue-50 text-action"
                  : "border-line bg-white text-graphite"
              }`}
            >
              {candidate}
            </button>
          ))}
        </div>
      </header>

      <section className="px-5 py-4">
        <div className="mb-3 flex items-center justify-between text-xs text-graphite">
          <span>{filtered.length} saved items</span>
          <span>Newest first</span>
        </div>
        {filtered.length === 0 ? (
          <StatusMessage title="No saved items" body="Save a training card to keep it here." />
        ) : (
          <div className="divide-y divide-line">
            {filtered.map((item) => (
              <article key={item.id} className="py-4">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <a
                      href={item.sourceLink}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-base font-semibold leading-5 text-ink"
                    >
                      {item.title}
                    </a>
                    <p className="mt-1 text-xs text-graphite">
                      {item.sourceName} · {formatRelativeTime(item.savedAt)} ·{" "}
                      {item.language.toUpperCase()} · {item.topic}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm leading-5 text-graphite">{item.summary}</p>
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void onUnsave(item.id)}
                    className="min-h-8 shrink-0 rounded-md px-2 text-sm font-semibold text-negative"
                  >
                    Unsave
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

