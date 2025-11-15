import {
  AttentionReasonCategory,
  ClientAttentionReason,
  ClientDraftRequest,
  ClientDraftResponse,
  ClientInsightScores,
  SemanticSearchResult,
} from '@shared/types/insights';

interface ClientLike {
  id: number;
  fullName?: string | null;
  tier?: string | null;
  aumValue?: number | null;
  email?: string | null;
  phone?: string | null;
  lastContactDate?: string | Date | null;
  lastTransactionDate?: string | Date | null;
  riskProfile?: string | null;
  alertCount?: number | null;
  profileStatus?: string | null;
  incompleteSections?: string[] | null;
  investmentHorizon?: string | null;
  netWorth?: string | null;
}

function asDate(value?: string | Date | null): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function daysSince(date?: string | Date | null): number | null {
  const parsed = asDate(date);
  if (!parsed) return null;
  const diffMs = Date.now() - parsed.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function buildAttentionReason(
  category: AttentionReasonCategory,
  message: string,
  severity: 'info' | 'warning' | 'critical',
  signals: string[] = []
): ClientAttentionReason {
  return { category, message, severity, signals };
}

export function calculateClientInsights(client: ClientLike): ClientInsightScores {
  const attentionReasons: ClientAttentionReason[] = [];

  const daysSinceContact = daysSince(client.lastContactDate);
  const daysSinceTransaction = daysSince(client.lastTransactionDate);
  const alerts = client.alertCount ?? 0;
  const incompleteSections = client.incompleteSections ?? [];
  const profileIncomplete = client.profileStatus === 'incomplete' || incompleteSections.length > 0;

  let churnScore = 25;
  let upsellScore = 30;

  if (daysSinceContact === null) {
    churnScore += 20;
    attentionReasons.push(
      buildAttentionReason(
        'contact',
        'No recorded contact history',
        'warning',
        ['missing_contact']
      )
    );
  } else {
    if (daysSinceContact > 180) {
      churnScore += 40;
      attentionReasons.push(
        buildAttentionReason(
          'contact',
          `Contact overdue by ${daysSinceContact} days`,
          'critical',
          ['contact_gap']
        )
      );
    } else if (daysSinceContact > 120) {
      churnScore += 28;
      attentionReasons.push(
        buildAttentionReason(
          'contact',
          `Last touchpoint was ${daysSinceContact} days ago`,
          'warning',
          ['contact_gap']
        )
      );
    } else if (daysSinceContact > 75) {
      churnScore += 18;
      attentionReasons.push(
        buildAttentionReason(
          'contact',
          `Follow up recommended (last contact ${daysSinceContact} days ago)`,
          'warning',
          ['contact_gap']
        )
      );
    } else if (daysSinceContact > 45) {
      churnScore += 10;
      attentionReasons.push(
        buildAttentionReason(
          'engagement',
          'Consider a touchpoint to keep momentum high',
          'info',
          ['contact cadence']
        )
      );
    }
  }

  if (alerts > 0) {
    const severity = alerts > 2 ? 'critical' : 'warning';
    churnScore += 15 + Math.min(alerts * 5, 20);
    attentionReasons.push(
      buildAttentionReason(
        'alerts',
        alerts === 1 ? 'One active alert requires review' : `${alerts} active alerts to resolve`,
        severity,
        ['alerts']
      )
    );
  }

  if (profileIncomplete) {
    churnScore += 12;
    if (incompleteSections.length > 0) {
      attentionReasons.push(
        buildAttentionReason(
          'profile',
          `Missing profile sections: ${incompleteSections.slice(0, 2).join(', ')}`,
          incompleteSections.length > 1 ? 'warning' : 'info',
          ['profile']
        )
      );
    } else {
      attentionReasons.push(
        buildAttentionReason('profile', 'Profile marked as incomplete', 'warning', ['profile'])
      );
    }
  }

  if (!client.investmentHorizon) {
    churnScore += 6;
    attentionReasons.push(
      buildAttentionReason(
        'profile',
        'Investment horizon is missing',
        'info',
        ['investment_horizon']
      )
    );
  }

  if (daysSinceTransaction !== null && daysSinceTransaction > 180) {
    churnScore += 12;
    attentionReasons.push(
      buildAttentionReason(
        'engagement',
        `No recent transactions (${daysSinceTransaction} days)`,
        'warning',
        ['transaction_gap']
      )
    );
  }

  const tier = (client.tier ?? '').toLowerCase();
  const tierWeight = tier === 'platinum' ? 25 : tier === 'gold' ? 18 : 12;
  upsellScore += tierWeight;

  const aum = client.aumValue ?? 0;
  if (aum > 2_00_00_000) {
    upsellScore += 20;
  } else if (aum > 1_00_00_000) {
    upsellScore += 15;
  } else if (aum > 50_00_000) {
    upsellScore += 10;
  } else if (aum > 10_00_000) {
    upsellScore += 6;
  } else {
    upsellScore += 3;
  }

  const riskProfile = (client.riskProfile ?? '').toLowerCase();
  if (riskProfile === 'aggressive') upsellScore += 8;
  else if (riskProfile === 'moderate') upsellScore += 4;

  if (profileIncomplete) {
    upsellScore -= 6;
  }

  if (alerts > 0) {
    upsellScore -= Math.min(10, alerts * 3);
  }

  if (daysSinceTransaction !== null && daysSinceTransaction < 60) {
    upsellScore += 6;
  }

  if (daysSinceContact !== null && daysSinceContact <= 30) {
    upsellScore += 5;
  }

  churnScore = clamp(churnScore, 5, 99);
  upsellScore = clamp(upsellScore, 5, 99);

  return {
    churnScore,
    upsellScore,
    attentionReasons,
  };
}

function textIncludes(text: string | null | undefined, token: string): boolean {
  if (!text) return false;
  return text.toLowerCase().includes(token);
}

function buildSemanticReason(
  client: ClientLike,
  token: string
): string | null {
  if (textIncludes(client.fullName, token)) {
    return `Matches name “${client.fullName}”`;
  }
  if (textIncludes(client.email, token)) {
    return `Matches email ${client.email}`;
  }
  if (textIncludes(client.phone, token)) {
    return `Matches phone ${client.phone}`;
  }
  if (textIncludes(client.tier, token)) {
    return `Tier relevance: ${client.tier}`;
  }
  if (textIncludes(client.riskProfile, token)) {
    return `Risk profile ${client.riskProfile}`;
  }
  if (textIncludes(client.investmentHorizon, token)) {
    return `Investment horizon ${client.investmentHorizon}`;
  }
  if (textIncludes(client.netWorth, token)) {
    return `Net worth mentions ${token}`;
  }
  return null;
}

const semanticKeywordBoost: Record<string, AttentionReasonCategory> = {
  churn: 'contact',
  risk: 'contact',
  attention: 'contact',
  "needs help": 'profile',
  alert: 'alerts',
  incomplete: 'profile',
  upsell: 'opportunity',
  expand: 'opportunity',
  "cross sell": 'opportunity',
  "follow up": 'contact',
};

export function semanticSearchClients(
  query: string,
  clients: ClientLike[]
): SemanticSearchResult[] {
  const tokens = query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  if (tokens.length === 0) return [];

  const results: SemanticSearchResult[] = [];

  for (const client of clients) {
    let score = 0;
    const reasons = new Set<string>();
    const matchedCategories = new Set<AttentionReasonCategory>();

    const { attentionReasons } = calculateClientInsights(client);

    for (const token of tokens) {
      const reason = buildSemanticReason(client, token);
      if (reason) {
        score += 18;
        reasons.add(reason);
      }
      if (semanticKeywordBoost[token]) {
        score += 12;
        matchedCategories.add(semanticKeywordBoost[token]);
      }
    }

    if (tokens.some(t => t === 'at risk' || t === 'churn')) {
      score += client.lastContactDate ? 10 : 18;
    }

    if (tokens.some(t => t.includes('attention'))) {
      score += attentionReasons.length * 6;
      attentionReasons.forEach(reason => {
        reasons.add(reason.message);
        matchedCategories.add(reason.category);
      });
    }

    if (tokens.some(t => t.includes('upsell') || t.includes('opportunity'))) {
      const { upsellScore } = calculateClientInsights(client);
      score += Math.round(upsellScore / 8);
      reasons.add('High upsell potential detected');
      matchedCategories.add('opportunity');
    }

    if (score === 0 && reasons.size === 0) {
      // fallback to partial string match on the combined text
      const combined = [
        client.fullName,
        client.email,
        client.phone,
        client.tier,
        client.riskProfile,
        client.investmentHorizon,
        client.netWorth,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      if (tokens.some(token => combined.includes(token))) {
        score += 10;
        reasons.add('General text match');
      }
    }

    if (score > 0) {
      results.push({
        clientId: client.id,
        score: clamp(score, 1, 100),
        reasons: Array.from(reasons).slice(0, 4),
        matchedCategories: matchedCategories.size > 0 ? Array.from(matchedCategories) : undefined,
      });
    }
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, 25);
}

function formatFirstName(fullName?: string | null): string {
  if (!fullName) return 'there';
  const parts = fullName.trim().split(/\s+/);
  return parts.length ? parts[0] : 'there';
}

function buildEmailDraft(client: ClientLike, insights: ClientInsightScores): ClientDraftResponse {
  const firstName = formatFirstName(client.fullName);
  const highlight = insights.attentionReasons[0]?.message ?? 'touch base';
  const subject = `${firstName}, a quick check-in on your portfolio`;
  const paragraphs = [
    `Hi ${firstName},`,
    `I hope you are doing well. I wanted to connect because ${highlight.toLowerCase()}.`,
    client.lastContactDate
      ? `It has been a little while since we last spoke on ${new Date(client.lastContactDate).toLocaleDateString()}, and I would love to ensure everything still aligns with your goals.`
      : `I would love to learn more about any changes in your goals so we can keep the portfolio aligned to them.`,
    `Would you be available for a quick catch-up next week? I can share a brief summary of how your investments are tracking and explore any opportunities that might interest you.`,
    'Best regards,',
    'Your Relationship Manager',
  ];

  return {
    content: paragraphs.join('\n\n'),
    metadata: {
      subject,
      callToAction: 'Schedule a call for next week',
      highlights: insights.attentionReasons.map(reason => reason.message).slice(0, 3),
      tone: 'warm',
      generatedAt: new Date().toISOString(),
    },
  };
}

function buildCallScript(client: ClientLike, insights: ClientInsightScores): ClientDraftResponse {
  const firstName = formatFirstName(client.fullName);
  const intro = `Hi ${firstName}, this is your relationship manager calling from Wealth RM.`;
  const engagement = insights.attentionReasons.find(reason => reason.category === 'contact');
  const opportunity = insights.attentionReasons.find(reason => reason.category === 'opportunity');

  const script = [
    intro,
    engagement
      ? `I wanted to reach out because ${engagement.message.toLowerCase()}.`
      : 'I wanted to check in and see how you are feeling about your current plan.',
    opportunity
      ? `While reviewing your portfolio I noticed ${opportunity.message.toLowerCase()}, and I thought it would be worth a quick discussion.`
      : 'I would love to make sure everything still aligns with your plans for the coming months.',
    'Do you have a few minutes this week for us to walk through the latest portfolio summary together?',
  ];

  return {
    content: script.join('\n\n'),
    metadata: {
      callToAction: 'Confirm availability for a follow-up conversation',
      highlights: insights.attentionReasons.map(reason => reason.message).slice(0, 3),
      tone: 'confident',
      generatedAt: new Date().toISOString(),
    },
  };
}

export function generateClientDraft(
  client: ClientLike,
  request: ClientDraftRequest
): ClientDraftResponse {
  const insights = calculateClientInsights(client);

  let draft: ClientDraftResponse;
  if (request.type === 'call_script') {
    draft = buildCallScript(client, insights);
  } else {
    draft = buildEmailDraft(client, insights);
  }

  if (request.tone && draft.metadata) {
    draft.metadata.tone = request.tone;
  }

  if (request.focus) {
    draft.metadata.highlights = [request.focus, ...(draft.metadata.highlights ?? [])].slice(0, 4);
  }

  return draft;
}

export type { ClientLike };
