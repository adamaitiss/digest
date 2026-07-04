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

export function createSupabaseRepository(client: SupabaseClient = createBrowserSupabaseClient()): AppRepository {
  return {
    mode: "supabase",
    async getCurrentUser(): Promise<SessionUser | null> {
      const { data, error } = await client.auth.getUser();
      if (error || !data.user) {
        return null;
      }
      return { id: data.user.id, email: data.user.email ?? "" };
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
        profile: {
          userId: String(profileRow.user_id),
          interestDescription: String(profileRow.interest_description ?? ""),
          learnedTopicWeights: (profileRow.learned_topic_weights as Record<string, number> | null) ?? {},
          learnedCountryWeights: (profileRow.learned_country_weights as Record<string, number> | null) ?? {},
          learnedEntityWeights: (profileRow.learned_entity_weights as Record<string, number> | null) ?? {},
          learnedSourcePreferences:
            (profileRow.learned_source_preferences as Record<string, number> | null) ?? {},
          blockedSources: (profileRow.blocked_sources as string[] | null) ?? [],
          demotedSources: (profileRow.demoted_sources as string[] | null) ?? [],
          blockedTopics: (profileRow.blocked_topics as string[] | null) ?? [],
          demotedTopics: (profileRow.demoted_topics as string[] | null) ?? [],
          noveltyPreference: Number(profileRow.novelty_preference ?? 0.5),
          businessSignificancePreference: Number(profileRow.business_significance_preference ?? 0.7),
          languagePreferences: (profileRow.language_preferences as ("en" | "ru")[] | null) ?? ["en", "ru"],
          updatedAt: String(profileRow.updated_at ?? "")
        },
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
      return {
        userId: String(profile.user_id),
        interestDescription: String(profile.interest_description ?? ""),
        learnedTopicWeights: (profile.learned_topic_weights as Record<string, number> | null) ?? {},
        learnedCountryWeights: (profile.learned_country_weights as Record<string, number> | null) ?? {},
        learnedEntityWeights: (profile.learned_entity_weights as Record<string, number> | null) ?? {},
        learnedSourcePreferences: (profile.learned_source_preferences as Record<string, number> | null) ?? {},
        blockedSources: (profile.blocked_sources as string[] | null) ?? [],
        demotedSources: (profile.demoted_sources as string[] | null) ?? [],
        blockedTopics: (profile.blocked_topics as string[] | null) ?? [],
        demotedTopics: (profile.demoted_topics as string[] | null) ?? [],
        noveltyPreference: Number(profile.novelty_preference ?? 0.5),
        businessSignificancePreference: Number(profile.business_significance_preference ?? 0.7),
        languagePreferences: (profile.language_preferences as ("en" | "ru")[] | null) ?? ["en", "ru"],
        updatedAt: String(profile.updated_at ?? "")
      };
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
    }
  };
}

