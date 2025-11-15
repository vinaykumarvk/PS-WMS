export type AttentionReasonCategory = 'contact' | 'profile' | 'portfolio' | 'alerts' | 'opportunity' | 'engagement';

export type AttentionSeverity = 'info' | 'warning' | 'critical';

export interface ClientAttentionReason {
  category: AttentionReasonCategory;
  message: string;
  severity: AttentionSeverity;
  signals?: string[];
}

export interface ClientInsightScores {
  churnScore: number;
  upsellScore: number;
  attentionReasons: ClientAttentionReason[];
}

export interface SemanticSearchResult {
  clientId: number;
  score: number;
  reasons: string[];
  matchedCategories?: AttentionReasonCategory[];
}

export type ClientDraftType = 'email_follow_up' | 'call_script';

export interface ClientDraftRequest {
  type: ClientDraftType;
  tone?: 'formal' | 'casual' | 'confident' | 'warm';
  focus?: string;
  additionalNotes?: string;
}

export interface ClientDraftResponse {
  content: string;
  metadata: {
    subject?: string;
    callToAction?: string;
    highlights?: string[];
    tone: string;
    generatedAt: string;
  };
}
