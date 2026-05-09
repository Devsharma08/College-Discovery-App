import { prisma } from '../config/prisma';

export const toPositiveInt = (value: unknown, fallback: number, max = 100) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.min(Math.floor(parsed), max);
};

export const paramToString = (value: string | string[] | undefined, name = 'id') => {
  const result = Array.isArray(value) ? value[0] : value;
  if (!result) throw new Error(`Missing route param: ${name}`);
  return result;
};

export const normalizeText = (value: unknown) => String(value ?? '').trim().toLowerCase();

export const isExamMatch = (cutoffExam: string, selectedExam: string) => {
  const cutoff = normalizeText(cutoffExam);
  const selected = normalizeText(selectedExam);
  if (!selected) return true;
  if (cutoff === selected || cutoff.includes(selected) || selected.includes(cutoff)) return true;

  const aliases: Record<string, string[]> = {
    entrance: ['general entrance', 'entrance', 'common entrance'],
    jee: ['jee', 'jee mains', 'jee main'],
    neet: ['neet'],
    met: ['met'],
  };

  return Object.values(aliases).some((group) => group.includes(cutoff) && group.includes(selected));
};

export type CollegeWithCutoffs = Awaited<ReturnType<typeof prisma.college.findMany>>[number] & {
  cutoffs: Array<{ examName: string; maxRank: number; category?: string | null }>;
};


export const getBestCutoffForRank = (college: CollegeWithCutoffs, exam: string, category: string, rank: number) => {
  const normalizedCategory = normalizeText(category);
  const categoryMatches = (cutoff: { category?: string | null }) =>
    !normalizedCategory || normalizeText(cutoff.category || 'General') === normalizedCategory;

  const examCutoffs = college.cutoffs.filter((cutoff) => isExamMatch(cutoff.examName, exam));
  const preferredCutoffs = examCutoffs.filter(categoryMatches);
  const fallbackCutoffs = preferredCutoffs.length > 0
    ? preferredCutoffs
    : examCutoffs.length > 0
      ? examCutoffs
      : college.cutoffs.filter(categoryMatches).length > 0
        ? college.cutoffs.filter(categoryMatches)
        : college.cutoffs;

  return [...fallbackCutoffs].sort((a, b) => {
    const aReachable = a.maxRank >= rank ? 0 : 1;
    const bReachable = b.maxRank >= rank ? 0 : 1;
    if (aReachable !== bReachable) return aReachable - bReachable;
    return Math.abs(a.maxRank - rank) - Math.abs(b.maxRank - rank);
  })[0];
};


export const getPredictionPercent = (rank: number, cutoffRank: number) => {
  const diff = cutoffRank - rank;
  const clamp = (value: number) => Math.max(5, Math.min(95, Math.round(value)));
  if (diff > 2000) return 95;
  if (diff > 0) return clamp(80 + (diff / 2000) * 15);
  if (diff > -500) return clamp(50 + (diff / 500) * 20);
  if (diff > -2000) return clamp(20 + (diff / 2000) * 30);
  return clamp(18 - Math.min(Math.abs(diff), 20_000) / 1600);
};

export const getMatchReason = (percent: number, examName: string, cutoffRank: number) => {
  if (percent >= 80) return `Strong match against the available ${examName} cutoff of rank ${cutoffRank}.`;
  if (percent >= 50) return `Close but realistic option against the available ${examName} cutoff of rank ${cutoffRank}.`;
  if (percent >= 20) return `Stretch option; the nearest available ${examName} cutoff is rank ${cutoffRank}.`;
  return `Ambitious option; nearest available ${examName} cutoff is rank ${cutoffRank}.`;
};
