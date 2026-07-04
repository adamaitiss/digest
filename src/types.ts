export type Language = "en" | "ru";

export type QueueReason = "predicted_relevant" | "exploration" | "must_know";

export type ReactionType =
  | "interesting"
  | "not_interesting"
  | "save"
  | "open_summary"
  | "hide_topic"
  | "hide_source"
  | "too_obvious"
  | "too_noisy"
  | "important_not_interesting"
  | "show_more_like_this";

export type DigestFeedback =
  | "useful"
  | "not_useful"
  | "important"
  | "duplicate"
  | "too_shallow"
  | "already_knew";

export interface SessionUser {
  id: string;
  email: string;
}

export interface TrainingCard {
  cardId: string;
  articleId: string;
  clusterId?: string | null;
  headline: string;
  sourceName: string;
  sourceUrl?: string;
  publishedAt: string;
  language: Language;
  topic: string;
  countries: string[];
  entities: string[];
  summaryReady: boolean;
  summary: string;
  whyShown: string;
  confidenceNote: string;
  sourceLink: string;
  supportingLinks: SourceLink[];
  queueReason: QueueReason;
}

export interface SourceLink {
  sourceName: string;
  url: string;
}

export interface DigestItem {
  id: string;
  digestId: string;
  clusterId: string;
  groupName: string;
  title: string;
  summary: string;
  whyItMatters: string;
  whySelected: string;
  sourceLinks: SourceLink[];
  confidenceNote: string;
  rank: number;
  feedbackStatus?: DigestFeedback | null;
  publishedAt: string;
  language: Language;
}

export interface Digest {
  id: string;
  date: string;
  generatedAt: string;
  status: "generating" | "ready" | "failed";
  trainingStatus: "not_started" | "partial" | "complete" | "skipped";
  itemCount: number;
  costEstimateUsd?: number | null;
  items: DigestItem[];
}

export interface SavedItem {
  id: string;
  articleId: string;
  clusterId?: string | null;
  title: string;
  sourceName: string;
  sourceLink: string;
  topic: string;
  language: Language;
  savedAt: string;
  publishedAt: string;
  summary: string;
}

export interface SourceHealth {
  sourceId: string;
  name: string;
  language: Language;
  countryRegion: string;
  active: boolean;
  authorityScore: number;
  noiseScore: number;
  lastSuccessfulFetch?: string | null;
  lastError?: string | null;
  fetchedItems24h: number;
  latestPublishedAt?: string | null;
}

export interface UserProfile {
  userId: string;
  interestDescription: string;
  learnedTopicWeights: Record<string, number>;
  learnedCountryWeights: Record<string, number>;
  learnedEntityWeights: Record<string, number>;
  learnedSourcePreferences: Record<string, number>;
  blockedSources: string[];
  demotedSources: string[];
  blockedTopics: string[];
  demotedTopics: string[];
  noveltyPreference: number;
  businessSignificancePreference: number;
  languagePreferences: Language[];
  updatedAt?: string;
}

export interface TrainingSessionState {
  sessionId: string;
  cardsShown: number;
  cardsReactedTo: number;
  targetCards: number;
  positiveCount: number;
  negativeCount: number;
  savesCount: number;
  explorationCardsShown: number;
  mustKnowCardsShown: number;
  completionStatus: "not_started" | "in_progress" | "complete";
}

export interface RepositorySnapshot {
  profile: UserProfile;
  cards: TrainingCard[];
  digest: Digest | null;
  saved: SavedItem[];
  sources: SourceHealth[];
  trainingSession: TrainingSessionState;
}

export interface AppRepository {
  mode: "demo" | "supabase";
  getCurrentUser(): Promise<SessionUser | null>;
  sendMagicLink(email: string): Promise<void>;
  signOut(): Promise<void>;
  loadSnapshot(): Promise<RepositorySnapshot>;
  updateProfile(description: string): Promise<UserProfile>;
  recordReaction(card: TrainingCard, reaction: ReactionType): Promise<void>;
  undoLastReaction(): Promise<void>;
  saveCard(card: TrainingCard): Promise<void>;
  unsaveItem(savedItemId: string): Promise<void>;
  recordDigestFeedback(item: DigestItem, feedback: DigestFeedback): Promise<void>;
}

