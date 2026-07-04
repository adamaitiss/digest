import { jaccardSimilarity } from "./text";

export interface ClusterCandidate {
  id: string;
  title: string;
  canonicalUrl: string;
  entities: string[];
  publishedAt: string;
}

export function isLikelyDuplicate(left: ClusterCandidate, right: ClusterCandidate): boolean {
  if (left.canonicalUrl && right.canonicalUrl && left.canonicalUrl === right.canonicalUrl) {
    return true;
  }
  const titleSimilarity = jaccardSimilarity(left.title, right.title);
  const sharedEntities = left.entities.filter((entity) => right.entities.includes(entity)).length;
  const hoursApart =
    Math.abs(new Date(left.publishedAt).getTime() - new Date(right.publishedAt).getTime()) /
    (1000 * 60 * 60);
  return titleSimilarity >= 0.58 && sharedEntities >= 1 && hoursApart <= 72;
}

export function groupLikelyDuplicates(candidates: ClusterCandidate[]): ClusterCandidate[][] {
  const groups: ClusterCandidate[][] = [];
  for (const candidate of candidates) {
    const group = groups.find((existing) => existing.some((item) => isLikelyDuplicate(item, candidate)));
    if (group) {
      group.push(candidate);
    } else {
      groups.push([candidate]);
    }
  }
  return groups;
}

