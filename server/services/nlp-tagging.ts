import { differenceInMinutes } from "date-fns";

export interface NlpTagsResult {
  tags: string[];
  sentiment: "positive" | "neutral" | "negative";
  keyPhrases: string[];
  entities: string[];
}

const KEYWORD_TAGS: { pattern: RegExp; tag: string }[] = [
  { pattern: /portfolio|investment|allocation|fund/i, tag: "portfolio" },
  { pattern: /tax|irs|deduct/i, tag: "tax" },
  { pattern: /retire|pension|401k|superannuation/i, tag: "retirement" },
  { pattern: /meeting|schedule|calendar|availability/i, tag: "scheduling" },
  { pattern: /risk|volatil/i, tag: "risk" },
  { pattern: /follow[- ]?up|action item|task/i, tag: "follow-up" },
  { pattern: /market|equit|stock|bond/i, tag: "market" },
  { pattern: /insurance|coverage|policy/i, tag: "insurance" },
  { pattern: /estate|will|trust/i, tag: "estate" },
  { pattern: /cash flow|budget|expense|spend/i, tag: "cash-flow" },
];

const POSITIVE_WORDS = [
  "great",
  "excellent",
  "positive",
  "good",
  "satisfied",
  "happy",
  "glad",
  "optimistic",
  "progress",
];

const NEGATIVE_WORDS = [
  "concern",
  "worried",
  "negative",
  "issue",
  "problem",
  "delay",
  "angry",
  "upset",
  "risk",
  "escalate",
];

const ENTITY_PATTERNS: { label: string; pattern: RegExp }[] = [
  { label: "date", pattern: /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2}(?:,\s*\d{4})?/gi },
  { label: "time", pattern: /\b\d{1,2}:\d{2}\s*(?:am|pm)?\b/gi },
  { label: "currency", pattern: /\$\s?\d+(?:,\d{3})*(?:\.\d{2})?/g },
  { label: "percentage", pattern: /\b\d{1,3}%\b/g },
];

function normalizeText(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/[^\w\s%$:.\-/]/g, "")
    .trim();
}

function extractKeyPhrases(text: string): string[] {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const phrases: string[] = [];
  for (const sentence of sentences) {
    const words = sentence.split(/\s+/);
    if (words.length <= 2) {
      phrases.push(sentence);
      continue;
    }

    for (let i = 0; i < words.length - 2; i++) {
      const chunk = normalizeText(words.slice(i, i + 3).join(" "));
      if (chunk.length > 6) {
        phrases.push(chunk);
      }
    }
  }

  return Array.from(new Set(phrases)).slice(0, 10);
}

function analyzeSentiment(text: string): "positive" | "neutral" | "negative" {
  let score = 0;
  const lowered = text.toLowerCase();

  for (const word of POSITIVE_WORDS) {
    if (lowered.includes(word)) score += 1;
  }

  for (const word of NEGATIVE_WORDS) {
    if (lowered.includes(word)) score -= 1;
  }

  if (score > 1) return "positive";
  if (score < 0) return "negative";
  return "neutral";
}

function extractEntities(text: string): string[] {
  const entities = new Set<string>();
  for (const { pattern } of ENTITY_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach((match) => entities.add(match.trim()));
    }
  }
  return Array.from(entities);
}

export function runNlpTaggingPipeline(input: {
  summary?: string;
  notes?: string;
  subject?: string;
  channel?: string;
  durationMinutes?: number | null;
}): NlpTagsResult {
  const text = normalizeText([
    input.subject || "",
    input.summary || "",
    input.notes || "",
  ].join(" "));

  const tags = new Set<string>();
  for (const { pattern, tag } of KEYWORD_TAGS) {
    if (pattern.test(text)) {
      tags.add(tag);
    }
  }

  if (input.channel) {
    tags.add(`channel:${input.channel.toLowerCase()}`);
  }

  if (typeof input.durationMinutes === "number" && !Number.isNaN(input.durationMinutes)) {
    if (input.durationMinutes > 45) {
      tags.add("long-session");
    } else if (input.durationMinutes < 15) {
      tags.add("brief-touchpoint");
    }
  }

  const sentiment = analyzeSentiment(text);
  const keyPhrases = extractKeyPhrases(text);
  const entities = extractEntities(text);

  return {
    tags: Array.from(tags),
    sentiment,
    keyPhrases,
    entities,
  };
}

export function scoreInteractionSuccess(sentiment: string | null | undefined, duration: number | null | undefined): number {
  let score = 1;

  if (sentiment === "positive") score += 1.5;
  else if (sentiment === "neutral") score += 0.5;
  else if (sentiment === "negative") score -= 1;

  if (typeof duration === "number" && !Number.isNaN(duration)) {
    if (duration >= 45) score += 0.75;
    else if (duration >= 20) score += 0.5;
    else if (duration < 10) score -= 0.25;
  }

  return Math.max(score, 0.1);
}

export function bucketInteractionTime(startTime: string | Date): { day: string; window: string } {
  const date = startTime instanceof Date ? startTime : new Date(startTime);
  const day = date.toLocaleDateString("en-US", { weekday: "long" });
  const hour = date.getHours();

  if (hour >= 5 && hour < 12) {
    return { day, window: "Morning (8am-12pm)" };
  }
  if (hour >= 12 && hour < 17) {
    return { day, window: "Afternoon (12pm-5pm)" };
  }
  if (hour >= 17 && hour < 21) {
    return { day, window: "Evening (5pm-9pm)" };
  }
  return { day, window: "Flexible Hours" };
}

export function calculateDurationMinutes(start: string | Date, end?: string | Date | null): number | null {
  if (!start || !end) return null;
  const startDate = start instanceof Date ? start : new Date(start);
  const endDate = end instanceof Date ? end : new Date(end);
  const minutes = differenceInMinutes(endDate, startDate);
  return Number.isFinite(minutes) ? Math.max(minutes, 0) : null;
}
