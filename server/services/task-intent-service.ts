import { IStorage } from '../storage';

export interface TaskInterpretationResult {
  suggestedTask: {
    title?: string;
    description?: string;
    dueDate?: string;
    priority?: string;
    clientId?: number | null;
  };
  entities: {
    intents: string[];
    dueDatePhrase?: string;
    priority?: string | null;
    clientName?: string | null;
  };
  confidence: number;
}

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const PRIORITY_KEYWORDS: Record<string, string> = {
  urgent: 'high',
  asap: 'high',
  critical: 'critical',
  high: 'high',
  medium: 'medium',
  normal: 'medium',
  low: 'low',
  routine: 'low',
};

const INTENT_KEYWORDS: Record<string, string> = {
  call: 'Call',
  phone: 'Call',
  ring: 'Call',
  meet: 'Meeting',
  meeting: 'Meeting',
  review: 'Review',
  follow: 'Follow-up',
  email: 'Email',
  mail: 'Email',
  update: 'Update',
  remind: 'Reminder',
  submit: 'Submission',
};

function toISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function parseRelativeDate(text: string, reference: Date): { date: Date; phrase: string } | null {
  const lower = text.toLowerCase();
  const working = new Date(reference);

  if (/day\s+after\s+tomorrow/.test(lower)) {
    working.setDate(working.getDate() + 2);
    return { date: working, phrase: 'day after tomorrow' };
  }

  if (/tomorrow/.test(lower)) {
    working.setDate(working.getDate() + 1);
    return { date: working, phrase: 'tomorrow' };
  }

  if (/today/.test(lower) || /by end of day/.test(lower)) {
    return { date: working, phrase: 'today' };
  }

  if (/next\s+week/.test(lower)) {
    working.setDate(working.getDate() + 7);
    return { date: working, phrase: 'next week' };
  }

  const nextWeekday = lower.match(/next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/);
  if (nextWeekday) {
    const targetIndex = WEEKDAYS.indexOf(nextWeekday[1]);
    if (targetIndex >= 0) {
      const currentIndex = working.getDay();
      let diff = targetIndex - currentIndex;
      if (diff <= 0) {
        diff += 7;
      }
      working.setDate(working.getDate() + diff);
      return { date: working, phrase: `next ${nextWeekday[1]}` };
    }
  }

  const weekdayMatch = lower.match(/by\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/);
  if (weekdayMatch) {
    const targetIndex = WEEKDAYS.indexOf(weekdayMatch[1]);
    if (targetIndex >= 0) {
      const currentIndex = working.getDay();
      let diff = targetIndex - currentIndex;
      if (diff < 0) {
        diff += 7;
      }
      working.setDate(working.getDate() + diff);
      return { date: working, phrase: `by ${weekdayMatch[1]}` };
    }
  }

  const isoMatch = lower.match(/(?:on|by)\s+(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) {
    const isoDate = new Date(isoMatch[1]);
    if (!Number.isNaN(isoDate.getTime())) {
      return { date: isoDate, phrase: isoMatch[1] };
    }
  }

  const slashMatch = lower.match(/(?:on|by)\s+(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
  if (slashMatch) {
    const day = Number(slashMatch[1]);
    const month = Number(slashMatch[2]) - 1;
    const year = slashMatch[3] ? Number(slashMatch[3]) : working.getFullYear();
    const candidate = new Date(year, month, day);
    if (!Number.isNaN(candidate.getTime())) {
      return { date: candidate, phrase: slashMatch[0].replace(/(?:on|by)\s+/, '') };
    }
  }

  const monthMatch = lower.match(/(?:on|by)\s+(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)/);
  if (monthMatch) {
    const day = Number(monthMatch[1]);
    const month = ['january','february','march','april','may','june','july','august','september','october','november','december'].indexOf(monthMatch[2]);
    const year = working.getFullYear() + (month < working.getMonth() ? 1 : 0);
    const candidate = new Date(year, month, day);
    if (!Number.isNaN(candidate.getTime())) {
      return { date: candidate, phrase: `${monthMatch[1]} ${monthMatch[2]}` };
    }
  }

  return null;
}

function detectPriority(text: string): string | null {
  const lower = text.toLowerCase();
  for (const keyword of Object.keys(PRIORITY_KEYWORDS)) {
    if (lower.includes(keyword)) {
      return PRIORITY_KEYWORDS[keyword];
    }
  }
  return null;
}

function detectIntents(text: string): string[] {
  const lower = text.toLowerCase();
  const intents = new Set<string>();
  for (const [keyword, label] of Object.entries(INTENT_KEYWORDS)) {
    if (lower.includes(keyword)) {
      intents.add(label);
    }
  }
  return Array.from(intents);
}

function capitalise(input: string): string {
  if (!input) return input;
  return input.charAt(0).toUpperCase() + input.slice(1);
}

async function matchClientId(text: string, storage: IStorage, userId: number): Promise<{ id: number; name: string } | null> {
  try {
    const clients = await storage.getClients(userId);
    if (!clients || clients.length === 0) {
      return null;
    }

    const lower = text.toLowerCase();
    let bestMatch: { id: number; name: string; score: number } | null = null;

    for (const client of clients) {
      if (!client.fullName) continue;
      const clientLower = client.fullName.toLowerCase();
      if (lower.includes(clientLower)) {
        return { id: client.id, name: client.fullName };
      }

      const parts = clientLower.split(/\s+/).filter(Boolean);
      const matchedParts = parts.filter(part => lower.includes(part));
      if (matchedParts.length > 0) {
        const score = matchedParts.length / parts.length;
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { id: client.id, name: client.fullName, score };
        }
      }
    }

    if (bestMatch && bestMatch.score >= 0.5) {
      return { id: bestMatch.id, name: bestMatch.name };
    }
  } catch (error) {
    console.warn('[task-intent] Failed to fetch clients for intent matching:', error);
  }
  return null;
}

export async function interpretTaskInput(
  input: string,
  storage: IStorage,
  userId: number
): Promise<TaskInterpretationResult> {
  const trimmed = input.trim();
  if (!trimmed) {
    return {
      suggestedTask: {},
      entities: { intents: [] },
      confidence: 0,
    };
  }

  const now = new Date();
  const intents = detectIntents(trimmed);
  const priority = detectPriority(trimmed);
  const dueDateInfo = parseRelativeDate(trimmed, now);
  const clientMatch = await matchClientId(trimmed, storage, userId);

  const firstSentence = trimmed.split(/[.!?]/)[0]?.trim() ?? trimmed;
  let title = capitalise(firstSentence);
  if (intents.length > 0 && clientMatch) {
    const action = intents[0];
    const subject = firstSentence.replace(new RegExp(clientMatch.name, 'i'), '').trim();
    title = `${action} ${clientMatch.name}${subject ? ` ${subject}` : ''}`.trim();
  }

  const suggestedTask = {
    title,
    description: capitalise(trimmed),
    dueDate: dueDateInfo ? toISODate(dueDateInfo.date) : undefined,
    priority: priority ?? undefined,
    clientId: clientMatch?.id ?? undefined,
  };

  let confidence = 0.4;
  if (dueDateInfo) confidence += 0.2;
  if (priority) confidence += 0.15;
  if (clientMatch) confidence += 0.15;
  if (intents.length > 0) confidence += 0.1;
  confidence = Math.min(0.95, confidence);

  return {
    suggestedTask,
    entities: {
      intents,
      dueDatePhrase: dueDateInfo?.phrase,
      priority: priority ?? null,
      clientName: clientMatch?.name ?? null,
    },
    confidence,
  };
}
