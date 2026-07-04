import { ChevronRight, LogOut, Save } from "lucide-react";
import { useMemo, useState } from "react";
import type { RepositorySnapshot } from "../types";

interface ProfileScreenProps {
  snapshot: RepositorySnapshot;
  busy: boolean;
  onUpdateProfile(description: string): Promise<void>;
  onSignOut(): Promise<void>;
}

export function ProfileScreen({ snapshot, busy, onUpdateProfile, onSignOut }: ProfileScreenProps) {
  const [description, setDescription] = useState(snapshot.profile.interestDescription);
  const activeSources = snapshot.sources.filter((source) => source.active);

  const preferenceSummary = useMemo(() => {
    const topic = Object.entries(snapshot.profile.learnedTopicWeights)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([key]) => key)
      .join(", ");
    const countries = Object.entries(snapshot.profile.learnedCountryWeights)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([key]) => key)
      .join(", ");
    return `You prefer ${topic || "business and technology"} coverage, with emphasis on ${
      countries || "global"
    } context. You read both RU and EN sources and prefer grounded source links.`;
  }, [snapshot.profile.learnedCountryWeights, snapshot.profile.learnedTopicWeights]);

  return (
    <main className="min-h-full bg-white">
      <header className="sticky top-0 z-20 border-b border-line bg-white px-5 pb-3 pt-4">
        <div className="grid grid-cols-2 rounded-none border-b border-line text-center">
          <span className="border-b-2 border-action pb-2 text-sm font-semibold text-action">Profile</span>
          <span className="pb-2 text-sm font-semibold text-graphite">Sources</span>
        </div>
      </header>

      <section className="space-y-5 px-5 py-4">
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h1 className="text-sm font-semibold text-ink">Interest description</h1>
            <button
              type="button"
              disabled={busy || description === snapshot.profile.interestDescription}
              onClick={() => void onUpdateProfile(description)}
              className="inline-flex min-h-8 items-center gap-1 rounded-md px-2 text-sm font-semibold text-action disabled:text-graphite"
            >
              <Save aria-hidden="true" size={15} />
              Save
            </button>
          </div>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={6}
            className="w-full resize-none rounded-lg border border-line px-3 py-3 text-sm leading-5 text-ink outline-none"
          />
          <p className="mt-2 text-xs leading-5 text-graphite">
            Write naturally. This seeds profile embeddings and the first-pass ranking model.
          </p>
        </section>

        <section className="border-y border-line py-4">
          <h2 className="mb-2 text-sm font-semibold text-ink">Learned preferences</h2>
          <p className="text-sm leading-6 text-graphite">{preferenceSummary}</p>
        </section>

        <section className="divide-y divide-line border-b border-line">
          <PreferenceRow label="Blocked sources" value={snapshot.profile.blockedSources.length} />
          <PreferenceRow label="Demoted sources" value={snapshot.profile.demotedSources.length} />
          <PreferenceRow label="Demoted topics" value={snapshot.profile.demotedTopics.length} />
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Source health</h2>
            <span className="text-xs text-graphite">
              {activeSources.length} / {snapshot.sources.length} active
            </span>
          </div>
          <div className="overflow-hidden rounded-lg border border-line">
            <table className="w-full table-fixed border-collapse text-left text-xs">
              <thead className="bg-panel text-graphite">
                <tr>
                  <th className="px-2 py-2 font-semibold">Source</th>
                  <th className="px-2 py-2 font-semibold">Lang</th>
                  <th className="px-2 py-2 font-semibold">Items</th>
                  <th className="px-2 py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {snapshot.sources.map((source) => (
                  <tr key={source.sourceId}>
                    <td className="px-2 py-2 font-semibold text-ink">{source.name}</td>
                    <td className="px-2 py-2 text-graphite">{source.language.toUpperCase()}</td>
                    <td className="px-2 py-2 text-graphite">{source.fetchedItems24h}</td>
                    <td
                      className={`px-2 py-2 font-semibold ${
                        source.active ? "text-positive" : "text-negative"
                      }`}
                    >
                      {source.active ? "OK" : "Error"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <button
          type="button"
          onClick={() => void onSignOut()}
          className="inline-flex min-h-10 items-center gap-2 rounded-md border border-line px-3 text-sm font-semibold text-graphite"
        >
          <LogOut aria-hidden="true" size={17} />
          Sign out
        </button>
      </section>
    </main>
  );
}

function PreferenceRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex min-h-11 items-center justify-between py-2">
      <span className="text-sm text-ink">{label}</span>
      <span className="inline-flex items-center gap-2 text-sm text-graphite">
        {value}
        <ChevronRight aria-hidden="true" size={17} />
      </span>
    </div>
  );
}

