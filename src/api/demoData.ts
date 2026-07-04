import type {
  Digest,
  SavedItem,
  SourceHealth,
  TrainingCard,
  TrainingSessionState,
  UserProfile
} from "../types";

const now = Date.now();
const hour = 60 * 60 * 1000;

export const demoProfile: UserProfile = {
  userId: "demo-user",
  interestDescription:
    "I read business, technology, markets, policy, and global news in English and Russian. I care about monetary policy, AI, energy, geopolitics, equities, and credible primary-source context.",
  learnedTopicWeights: {
    Technology: 0.82,
    Markets: 0.76,
    Policy: 0.68,
    "Global Context": 0.59
  },
  learnedCountryWeights: { US: 0.78, EU: 0.62, Russia: 0.58, China: 0.55 },
  learnedEntityWeights: { "central banks": 0.8, AI: 0.77, energy: 0.64 },
  learnedSourcePreferences: { Reuters: 0.86, Bloomberg: 0.81, RBC: 0.67 },
  blockedSources: [],
  demotedSources: ["noisy blogs"],
  blockedTopics: [],
  demotedTopics: ["celebrity"],
  noveltyPreference: 0.64,
  businessSignificancePreference: 0.84,
  languagePreferences: ["en", "ru"],
  updatedAt: new Date(now - 2 * hour).toISOString()
};

export const demoCards: TrainingCard[] = [
  {
    cardId: "card-fed-rate",
    articleId: "article-fed-rate",
    clusterId: "cluster-fed-rate",
    headline: "Fed signals caution on rate cuts as inflation progress stalls",
    sourceName: "Reuters",
    publishedAt: new Date(now - 2 * hour).toISOString(),
    language: "en",
    topic: "Markets",
    countries: ["US"],
    entities: ["Federal Reserve", "inflation"],
    summaryReady: true,
    summary:
      "Federal Reserve officials said they need more evidence that price pressures are moving sustainably lower before adjusting rates.",
    whyShown:
      "Matches your focus on monetary policy, central banks, and inflation trends.",
    confidenceNote: "Multiple-source cluster; summary uses headline and snippet-level source text.",
    sourceLink: "https://www.reuters.com/",
    supportingLinks: [{ sourceName: "Reuters", url: "https://www.reuters.com/" }],
    queueReason: "predicted_relevant"
  },
  {
    cardId: "card-eu-ai",
    articleId: "article-eu-ai",
    clusterId: "cluster-eu-ai",
    headline: "EU adopts AI Act rules for high-risk systems",
    sourceName: "European Commission",
    publishedAt: new Date(now - 5 * hour).toISOString(),
    language: "en",
    topic: "Policy",
    countries: ["EU"],
    entities: ["AI Act", "European Commission"],
    summaryReady: true,
    summary:
      "EU officials published rules for high-risk AI systems, with compliance duties for developers and deployers.",
    whyShown: "Must-know policy item adjacent to your AI and regulation interests.",
    confidenceNote: "Official source; limited secondary coverage in this demo snapshot.",
    sourceLink: "https://commission.europa.eu/",
    supportingLinks: [{ sourceName: "European Commission", url: "https://commission.europa.eu/" }],
    queueReason: "must_know"
  },
  {
    cardId: "card-rbc-rates",
    articleId: "article-rbc-rates",
    clusterId: "cluster-rbc-rates",
    headline: "Банк России сохранил сигнал о жесткой денежной политике",
    sourceName: "РБК",
    publishedAt: new Date(now - 7 * hour).toISOString(),
    language: "ru",
    topic: "Markets",
    countries: ["Russia"],
    entities: ["Банк России", "инфляция"],
    summaryReady: true,
    summary:
      "Материал описывает сохранение жесткого сигнала в денежно-кредитной политике на фоне инфляционных рисков.",
    whyShown:
      "Русскоязычный источник по теме центральных банков и инфляции, важный для RU coverage.",
    confidenceNote: "Single source; treat as preliminary.",
    sourceLink: "https://www.rbc.ru/",
    supportingLinks: [{ sourceName: "РБК", url: "https://www.rbc.ru/" }],
    queueReason: "exploration"
  },
  {
    cardId: "card-energy",
    articleId: "article-energy",
    clusterId: "cluster-energy",
    headline: "OPEC+ extends production cuts into next quarter",
    sourceName: "Financial Times",
    publishedAt: new Date(now - 10 * hour).toISOString(),
    language: "en",
    topic: "Energy",
    countries: ["Global"],
    entities: ["OPEC+", "oil"],
    summaryReady: true,
    summary:
      "Oil producers agreed to extend supply curbs, keeping market attention on inventory levels and demand forecasts.",
    whyShown: "Exploration item connected to energy markets and macro conditions.",
    confidenceNote: "Paywalled source; summary based on headline/snippet.",
    sourceLink: "https://www.ft.com/",
    supportingLinks: [{ sourceName: "Financial Times", url: "https://www.ft.com/" }],
    queueReason: "exploration"
  }
];

export const demoDigest: Digest = {
  id: "digest-today",
  date: new Date(now).toISOString().slice(0, 10),
  generatedAt: new Date(now - hour).toISOString(),
  status: "ready",
  trainingStatus: "partial",
  itemCount: 6,
  costEstimateUsd: 0.64,
  items: [
    {
      id: "digest-fed-rate",
      digestId: "digest-today",
      clusterId: "cluster-fed-rate",
      groupName: "Markets and Policy",
      title: "Fed signals caution on rate cuts as inflation progress stalls",
      summary:
        "Federal Reserve officials said they need more evidence that price pressures are moving sustainably lower before adjusting rates.",
      whyItMatters:
        "Rate-cut timing affects equities, bonds, currencies, and borrowing costs.",
      whySelected:
        "Selected because you frequently save monetary-policy and central-bank items.",
      sourceLinks: [{ sourceName: "Reuters", url: "https://www.reuters.com/" }],
      confidenceNote: "Multiple-source cluster; treat as medium confidence.",
      rank: 1,
      feedbackStatus: null,
      publishedAt: new Date(now - 2 * hour).toISOString(),
      language: "en"
    },
    {
      id: "digest-eu-ai",
      digestId: "digest-today",
      clusterId: "cluster-eu-ai",
      groupName: "Technology and Regulation",
      title: "EU adopts AI Act rules for high-risk systems",
      summary:
        "EU officials published rules for high-risk AI systems, with compliance duties for developers and deployers.",
      whyItMatters:
        "The rules shape AI product compliance and deployment risk for companies operating in Europe.",
      whySelected: "Selected as a must-know AI regulation item.",
      sourceLinks: [{ sourceName: "European Commission", url: "https://commission.europa.eu/" }],
      confidenceNote: "Official source; limited secondary coverage.",
      rank: 2,
      feedbackStatus: null,
      publishedAt: new Date(now - 5 * hour).toISOString(),
      language: "en"
    },
    {
      id: "digest-rbc-rates",
      digestId: "digest-today",
      clusterId: "cluster-rbc-rates",
      groupName: "RU Economy",
      title: "Банк России сохранил сигнал о жесткой денежной политике",
      summary:
        "Материал описывает сохранение жесткого сигнала в денежно-кредитной политике на фоне инфляционных рисков.",
      whyItMatters: "Денежная политика влияет на рынки, кредитование и инфляционные ожидания.",
      whySelected: "Selected to preserve RU-language coverage in your macro digest.",
      sourceLinks: [{ sourceName: "РБК", url: "https://www.rbc.ru/" }],
      confidenceNote: "Single source; summary stays close to source snippet.",
      rank: 3,
      feedbackStatus: null,
      publishedAt: new Date(now - 7 * hour).toISOString(),
      language: "ru"
    }
  ]
};

export const demoSaved: SavedItem[] = [
  {
    id: "saved-fed-rate",
    articleId: "article-fed-rate",
    clusterId: "cluster-fed-rate",
    title: "Fed signals caution on rate cuts as inflation progress stalls",
    sourceName: "Reuters",
    sourceLink: "https://www.reuters.com/",
    topic: "Markets",
    language: "en",
    savedAt: new Date(now - 35 * hour).toISOString(),
    publishedAt: new Date(now - 2 * hour).toISOString(),
    summary:
      "Federal Reserve officials said they need more evidence that price pressures are moving sustainably lower."
  }
];

export const demoSources: SourceHealth[] = [
  {
    sourceId: "reuters_business",
    name: "Reuters Business",
    language: "en",
    countryRegion: "Global",
    active: true,
    authorityScore: 0.92,
    noiseScore: 0.1,
    lastSuccessfulFetch: new Date(now - hour).toISOString(),
    lastError: null,
    fetchedItems24h: 34,
    latestPublishedAt: new Date(now - hour).toISOString()
  },
  {
    sourceId: "rbc_news",
    name: "РБК",
    language: "ru",
    countryRegion: "Russia",
    active: true,
    authorityScore: 0.72,
    noiseScore: 0.24,
    lastSuccessfulFetch: new Date(now - 2 * hour).toISOString(),
    lastError: null,
    fetchedItems24h: 22,
    latestPublishedAt: new Date(now - 2 * hour).toISOString()
  },
  {
    sourceId: "kommersant",
    name: "Коммерсантъ",
    language: "ru",
    countryRegion: "Russia",
    active: false,
    authorityScore: 0.76,
    noiseScore: 0.22,
    lastSuccessfulFetch: null,
    lastError: "RSS timeout from current network",
    fetchedItems24h: 0,
    latestPublishedAt: null
  }
];

export const demoTrainingSession: TrainingSessionState = {
  sessionId: "session-today",
  cardsShown: 18,
  cardsReactedTo: 17,
  targetCards: 60,
  positiveCount: 9,
  negativeCount: 7,
  savesCount: 1,
  explorationCardsShown: 5,
  mustKnowCardsShown: 3,
  completionStatus: "in_progress"
};

