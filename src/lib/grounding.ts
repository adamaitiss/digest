import { tokenize } from "./text";

const entityPattern = /(?:[A-ZА-ЯЁ][\p{L}\p{N}&.'-]*(?:\s+[A-ZА-ЯЁ][\p{L}\p{N}&.'-]*)*)/gu;
const numberPattern = /\d+(?:[.,]\d+)?%?/g;

export interface GroundingResult {
  passed: boolean;
  missingEntities: string[];
  missingNumbers: string[];
  sourceTokenCoverage: number;
}

export function verifyGroundedText(generatedText: string, sourceText: string): GroundingResult {
  const sourceNormalized = sourceText.toLowerCase();
  const generatedTokens = tokenize(generatedText);
  const sourceTokens = new Set(tokenize(sourceText));
  const supportedTokens = generatedTokens.filter((token) => sourceTokens.has(token)).length;
  const sourceTokenCoverage = generatedTokens.length === 0 ? 1 : supportedTokens / generatedTokens.length;

  const missingEntities = unique(extractMatches(generatedText, entityPattern).map(normalizeEntity)).filter(
    (entity) => !sourceNormalized.includes(entity.toLowerCase())
  );
  const missingNumbers = unique(extractMatches(generatedText, numberPattern)).filter(
    (number) => !sourceNormalized.includes(number.toLowerCase())
  );

  return {
    passed: missingEntities.length === 0 && missingNumbers.length === 0 && sourceTokenCoverage >= 0.45,
    missingEntities,
    missingNumbers,
    sourceTokenCoverage
  };
}

export function fallbackLiteralSummary(title: string, snippet: string | null | undefined): string {
  const source = snippet?.trim();
  if (source) {
    return source.length > 420 ? `${source.slice(0, 417).trim()}...` : source;
  }
  return `Source text is limited to the headline: "${title}".`;
}

function extractMatches(value: string, pattern: RegExp): string[] {
  return value.match(pattern)?.map((match) => match.trim()).filter(Boolean) ?? [];
}

function normalizeEntity(value: string): string {
  return value
    .replace(/^(The|A|An|Chair|CEO|President|Minister|Mr|Ms|Mrs|Dr)\s+/u, "")
    .trim();
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}
