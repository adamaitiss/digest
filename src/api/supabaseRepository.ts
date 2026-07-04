import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AppRepository,
  Digest,
  DigestFeedback,
  DigestItem,
  ReactionType,
  RepositorySnapshot,
  SavedItem,
  SessionUser,
  SourceHealth,
  TrainingCard,
  TrainingSessionState,
  UserProfile
} from "../types";
import { createBrowserSupabaseClient } from "./supabaseClient";

function requireData<T>(data: T | null, error: { message?: string } | null): T {
  if (error) {
    throw new Error(error.message ?? "Supabase request failed.");
  }
  if (data === null) {
    throw new Error("Supabase returned no data.");
  }
  return data;
}

function mapCard(row: Record<string, unknown>): TrainingCard {
  return {
    cardId: String(row.card_id),
    articleId: String(row.article_id),
    clusterId: row.cluster_id ? String(row.cluster_id) : null,
    headline: String(row.headline),
    sourceName: String(row.source_name),
    publishedAt: String(row.published_at),
    language: row.language === "ru" ? "ru" : "en",
    topic: String(row.topic ?? "General"),
    countries: (row.countries as string[] | null) ?? [],
    entities: (row.entities as string[] | null) ?? [],
    summaryReady: Boolean(row.summary_ready),
    summary: String(row.summary ?? ""),
    whyShown: String(row.why_shown ?? ""),
    confidenceNote: String(row.confidence_note ?? ""),
    sourceLink: String(row.source_link ?? ""),
    supportingLinks: (row.supporting_links as { sourceName: string; url: string }[] | null) ?? [],
    queueReason:
      row.queue_reason === "exploration" || row.queue_reason === "must_know"
        ? row.queue_reason
        : "predicted_relevant"
  };
}

function mapDigestItem(row: Record<string, unknown>): DigestItem {
  return {
    id: String(row.digest_item_id ?? row.id),
    digestId: String(row.digest_id),
    clusterId: String(row.cluster_id),
    groupName: String(row.group_name ?? "Today"),
    title: String(row.title),
    summary: String(row.summary ?? ""),
    whyItMatters: String(row.why_it_matters ?? ""),
    whySelected: String(row.why_selected ?? ""),
    sourceLinks: (row.source_links as { sourceName: string; url: string }[] | null) ?? [],
    confidenceNote: String(row.confidence_note ?? ""),
    rank: Number(row.rank ?? 0),
    feedbackStatus: (row.feedback_status as DigestFeedback | null) ?? null,
    publishedAt: String(row.published_at ?? row.generated_at),
    language: row.language === "ru" ? "ru" : "en"
  };
}

function mapSaved(row: Record<string, unknown>): SavedItem {
  return {
    id: String(row.saved_item_id ?? row.id),
    articleId: String(row.article_id),
    clusterId: row.cluster_id ? String(row.cluster_id) : null,
    title: String(row.title),
    sourceName: String(row.source_name),
    sourceLink: String(row.source_link),
    topic: String(row.topic ?? "General"),
    language: row.language === "ru" ? "ru" : "en",
    savedAt: String(row.saved_at),
    publishedAt: String(row.published_at),
    summary: String(row.summary ?? "")
  };
}

function mapProfile(row: Record<string, unknown>): UserProfile {
  return {
    userId: String(row.user_id),
    interestDescription: String(row.interest_description ?? ""),
    learnedTopicWeights: (row.learned_topic_weights as Record<string, number> | null) ?? {},
    learnedCountryWeights: (row.learned_country_weights as Record<string, number> | null) ?? {},
    learnedEntityWeights: (row.learned_entity_weights as Record<string, number> | null) ?? {},
    learnedSourcePreferences: (row.learned_source_preferences as Record<string, number> | null) ?? {},
    blockedSources: (row.blocked_sources as string[] | null) ?? [],
    demotedSources: (row.demoted_sources as string[] | null) ?? [],
    blockedTopics: (row.blocked_topics as string[] | null) ?? [],
    demotedTopics: (row.demoted_topics as string[] | null) ?? [],
    noveltyPreference: Number(row.novelty_preference ?? 0.5),
    businessSignificancePreference: Number(row.business_significance_preference ?? 0.7),
    languagePreferences: (row.language_preferences as ("en" | "ru")[] | null) ?? ["en", "ru"],
    updatedAt: String(row.updated_at ?? "")
  };
}

function createUrlSessionHydrator(client: SupabaseClient): () => Promise<void> {
  let hydrationPromise: Promise<void> | null = null;

  return () => {
    if (!hydrationPromise) {
      hydrationPromise = (async () => {
        if (typeof window === "undefined" || !window.location.hash) {
          return;
        }

        const hash = new URLSearchParams(window.location.hash.slice(1));
        const accessToken = hash.get("access_token");
        const refreshToken = hash.get("refresh_token");
        if (!accessToken || !refreshToken) {
          return;
        }

        const { error } = await client.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });
        if (error) {
          throw error;
        }

        window.history.replaceState(null, document.title, `${window.location.pathname}${window.location.search}`);
      })();
    }
    return hydrationPromise;
  };
}

export function createSupabaseRepository(client: SupabaseClient = createBrowserSupabaseClient()): AppRepository {
  const hydrateUrlSession = createUrlSessionHydrator(client);

  return {
    mode: "supabase",
    async getCurrentUser(): Promise<SessionUser | null> {
      await hydrateUrlSession();
      const { data, error } = await client.auth.getUser();
      if (error || !data.user) {
        return null;
      }
      return { id: data.user.id, email: data.user.email ?? "" };
    },
    onAuthStateChange(callback: (user: SessionUser | null) => void): () => void {
      const { data } = client.auth.onAuthStateChange((_event, session) => {
        callback(session?.user ? { id: session.user.id, email: session.user.email ?? "" } : null);
      });
      return () => data.subscription.unsubscribe();
    },
    async sendMagicLink(email: string): Promise<void> {
      const redirectTo = `${window.location.origin}${import.meta.env.BASE_URL}`;
      const { error } = await client.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo }
      });
      if (error) {
        throw error;
      }
    },
    async signOut(): Promise<void> {
      await client.auth.signOut();
    },
    async loadSnapshot(): Promise<RepositorySnapshot> {
      const profileResult = await client.rpc("get_or_create_profile");
      const profileRow = requireData<Record<string, unknown>>(profileResult.data, profileResult.error);
      const [cardsResult, digestResult, savedResult, sourcesResult, sessionResult] = await Promise.all([
        client.from("training_cards_today").select("*").limit(100),
        client.from("digest_today").select("*").maybeSingle(),
        client.from("saved_items_view").select("*").order("saved_at", { ascending: false }),
        client.from("source_health_status").select("*").order("name"),
        client.rpc("get_training_session_state")
      ]);

      const digestRow = digestResult.error ? null : digestResult.data;
      let digest: Digest | null = null;
      if (digestRow) {
        const itemResult = await client
          .from("digest_items_view")
          .select("*")
          .eq("digest_id", digestRow.digest_id)
          .order("rank");
        const items = requireData<Record<string, unknown>[]>(itemResult.data, itemResult.error).map(mapDigestItem);
        digest = {
          id: String(digestRow.digest_id),
          date: String(digestRow.digest_date),
          generatedAt: String(digestRow.generated_at),
          status: String(digestRow.status) as Digest["status"],
          trainingStatus: String(digestRow.training_status ?? "skipped") as Digest["trainingStatus"],
          itemCount: Number(digestRow.item_count ?? items.length),
          costEstimateUsd: digestRow.cost_estimate_usd ? Number(digestRow.cost_estimate_usd) : null,
          items
        };
      }

      return {
        profile: mapProfile(profileRow),
        cards: requireData<Record<string, unknown>[]>(cardsResult.data, cardsResult.error).map(mapCard),
        digest,
        saved: requireData<Record<string, unknown>[]>(savedResult.data, savedResult.error).map(mapSaved),
        sources: requireData<Record<string, unknown>[]>(sourcesResult.data, sourcesResult.error).map((row) => ({
          sourceId: String(row.source_id),
          name: String(row.name),
          language: row.language === "ru" ? "ru" : "en",
          countryRegion: String(row.country_region ?? ""),
          active: Boolean(row.active),
          authorityScore: Number(row.authority_score ?? 0),
          noiseScore: Number(row.noise_score ?? 0),
          lastSuccessfulFetch: row.last_successful_fetch ? String(row.last_successful_fetch) : null,
          lastError: row.last_error ? String(row.last_error) : null,
          fetchedItems24h: Number(row.fetched_items_24h ?? 0),
          latestPublishedAt: row.latest_published_at ? String(row.latest_published_at) : null
        })) as SourceHealth[],
        trainingSession: requireData<TrainingSessionState>(sessionResult.data, sessionResult.error)
      };
    },
    async updateProfile(description: string): Promise<UserProfile> {
      const result = await client.rpc("update_profile", { p_interest_description: description });
      const profile = requireData<Record<string, unknown>>(result.data, result.error);
      return mapProfile(profile);
    },
    async recordReaction(card: TrainingCard, reaction: ReactionType): Promise<void> {
      const { error } = await client.rpc("record_card_reaction", {
        p_article_id: card.articleId,
        p_cluster_id: card.clusterId,
        p_signal_type: reaction,
        p_context: "training_queue"
      });
      if (error) {
        throw error;
      }
    },
    async recordOpenSummary(card: TrainingCard): Promise<void> {
      const { error } = await client.rpc("record_card_reaction", {
        p_article_id: card.articleId,
        p_cluster_id: card.clusterId,
        p_signal_type: "open_summary",
        p_context: "summary_open"
      });
      if (error) {
        throw error;
      }
    },
    async undoLastReaction(): Promise<void> {
      const { error } = await client.rpc("undo_last_card_reaction");
      if (error) {
        throw error;
      }
    },
    async saveCard(card: TrainingCard): Promise<void> {
      const { error } = await client.rpc("save_item", {
        p_article_id: card.articleId,
        p_cluster_id: card.clusterId
      });
      if (error) {
        throw error;
      }
    },
    async unsaveItem(savedItemId: string): Promise<void> {
      const { error } = await client.rpc("unsave_item", { p_saved_item_id: savedItemId });
      if (error) {
        throw error;
      }
    },
    async recordDigestFeedback(item: DigestItem, feedback: DigestFeedback): Promise<void> {
      const { error } = await client.rpc("record_digest_feedback", {
        p_digest_item_id: item.id,
        p_feedback: feedback
      });
      if (error) {
        throw error;
      }
    },
    async resetLearnedPreferences(): Promise<UserProfile> {
      const result = await client.rpc("reset_learned_preferences");
      const profile = requireData<Record<string, unknown>>(result.data, result.error);
      return mapProfile(profile);
    },
    async exportUserData(): Promise<Record<string, unknown>> {
      const result = await client.rpc("export_user_data");
      return requireData<Record<string, unknown>>(result.data, result.error);
    }
  };
}
