export type TalkingPointStatus = 'active' | 'expiring_soon' | 'expired';

export interface SegmentMatch {
  segment_type: string;
  segment_value: string;
  confidence: number;
  weight: number;
  match_source: 'tag' | 'text' | 'synonym';
}

export interface TalkingPointScoreBreakdown {
  base_score: number;
  segment_boost: number;
  freshness_modifier: number;
}

export interface TalkingPoint {
  id: number;
  title: string;
  category: string;
  summary: string;
  detailed_content: string;
  source?: string;
  relevance_score?: number;
  personalized_score?: number;
  valid_until?: string | null;
  created_at?: string;
  tags?: string[];
  is_active?: boolean;
  status?: TalkingPointStatus;
  expires_in_days?: number | null;
  refresh_prompt?: string | null;
  auto_archived?: boolean;
  segment_matches?: SegmentMatch[];
  score_breakdown?: TalkingPointScoreBreakdown;
}
