import {
  demoCards,
  demoDigest,
  demoProfile,
  demoSaved,
  demoSources,
  demoTrainingSession
} from "./demoData";
import type {
  AppRepository,
  DigestFeedback,
  DigestItem,
  ReactionType,
  RepositorySnapshot,
  SavedItem,
  SessionUser,
  TrainingCard,
  UserProfile
} from "../types";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function createDemoRepository(): AppRepository {
  let profile = clone(demoProfile);
  let cards = clone(demoCards);
  let digest = clone(demoDigest);
  let saved = clone(demoSaved);
  let trainingSession = clone(demoTrainingSession);
  const reactionHistory: { card: TrainingCard; reaction: ReactionType }[] = [];

  function snapshot(): RepositorySnapshot {
    return {
      profile: clone(profile),
      cards: clone(cards),
      digest: clone(digest),
      saved: clone(saved),
      sources: clone(demoSources),
      trainingSession: clone(trainingSession)
    };
  }

  return {
    mode: "demo",
    async getCurrentUser(): Promise<SessionUser> {
      return { id: "demo-user", email: "demo@example.com" };
    },
    onAuthStateChange(): () => void {
      return () => undefined;
    },
    async sendMagicLink(): Promise<void> {
      return undefined;
    },
    async signOut(): Promise<void> {
      return undefined;
    },
    async loadSnapshot(): Promise<RepositorySnapshot> {
      return snapshot();
    },
    async updateProfile(description: string): Promise<UserProfile> {
      profile = {
        ...profile,
        interestDescription: description,
        updatedAt: new Date().toISOString()
      };
      return clone(profile);
    },
    async recordReaction(card: TrainingCard, reaction: ReactionType): Promise<void> {
      reactionHistory.push({ card: clone(card), reaction });
      cards = cards.filter((candidate) => candidate.cardId !== card.cardId);
      trainingSession = {
        ...trainingSession,
        cardsReactedTo: trainingSession.cardsReactedTo + 1,
        positiveCount:
          reaction === "interesting" || reaction === "save" || reaction === "show_more_like_this"
            ? trainingSession.positiveCount + 1
            : trainingSession.positiveCount,
        negativeCount:
          reaction === "not_interesting" || reaction === "too_noisy"
            ? trainingSession.negativeCount + 1
            : trainingSession.negativeCount,
        savesCount: reaction === "save" ? trainingSession.savesCount + 1 : trainingSession.savesCount
      };
      if (reaction === "save") {
        await this.saveCard(card);
      }
    },
    async undoLastReaction(): Promise<void> {
      const previous = reactionHistory.pop();
      if (!previous) {
        return;
      }
      cards = [previous.card, ...cards];
      trainingSession = {
        ...trainingSession,
        cardsReactedTo: Math.max(0, trainingSession.cardsReactedTo - 1)
      };
    },
    async saveCard(card: TrainingCard): Promise<void> {
      if (saved.some((item) => item.articleId === card.articleId)) {
        return;
      }
      const savedItem: SavedItem = {
        id: `saved-${card.articleId}`,
        articleId: card.articleId,
        clusterId: card.clusterId,
        title: card.headline,
        sourceName: card.sourceName,
        sourceLink: card.sourceLink,
        topic: card.topic,
        language: card.language,
        savedAt: new Date().toISOString(),
        publishedAt: card.publishedAt,
        summary: card.summary
      };
      saved = [savedItem, ...saved];
    },
    async unsaveItem(savedItemId: string): Promise<void> {
      saved = saved.filter((item) => item.id !== savedItemId);
    },
    async recordDigestFeedback(item: DigestItem, feedback: DigestFeedback): Promise<void> {
      digest = {
        ...digest,
        items: digest.items.map((candidate) =>
          candidate.id === item.id ? { ...candidate, feedbackStatus: feedback } : candidate
        )
      };
    }
  };
}
