export type ModelSeverity = "error" | "warning" | "info";
export type ModelCategory = "validation" | "consistency" | "transcription" | "summarization";

export interface ModelIssue {
  id: string;
  category: ModelCategory;
  severity: ModelSeverity;
  summary: string;
  detail?: string;
  field?: string;
  sourceModel?: string;
}

interface BaseModelResponse {
  issues?: ModelIssue[];
  traceId?: string;
  processedAt?: string;
  model?: string;
}

interface ValidationResponse extends BaseModelResponse {
  issues: ModelIssue[];
}

interface ConsistencyResponse extends BaseModelResponse {
  issues: ModelIssue[];
}

export interface ClientProfilePreflightPayload {
  clientId: number;
  proposedChanges: Record<string, any>;
  existingProfile?: Record<string, any> | null;
  context?: string;
}

export interface ClientProfilePreflightResult {
  issues: ModelIssue[];
  validationTraceId?: string;
  consistencyTraceId?: string;
  checkedAt: string;
}

const randomId = () => Math.random().toString(36).slice(2, 10);

async function postModelEndpoint<T>(endpoint: string, payload: unknown): Promise<T> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request to ${endpoint} failed`);
  }

  return response.json();
}

export async function runClientProfilePreflight(
  payload: ClientProfilePreflightPayload,
): Promise<ClientProfilePreflightResult> {
  const [validation, consistency] = await Promise.all([
    postModelEndpoint<ValidationResponse>("/api/models/validate-client", payload),
    postModelEndpoint<ConsistencyResponse>("/api/models/check-client-consistency", payload),
  ]);

  const normalizeIssues = (issues: ModelIssue[] | undefined, fallbackCategory: ModelCategory) =>
    (issues ?? []).map((issue) => ({
      ...issue,
      id: issue.id || randomId(),
      category: issue.category ?? fallbackCategory,
    }));

  const combinedIssues = [
    ...normalizeIssues(validation?.issues, "validation"),
    ...normalizeIssues(consistency?.issues, "consistency"),
  ];

  return {
    issues: combinedIssues,
    validationTraceId: validation?.traceId,
    consistencyTraceId: consistency?.traceId,
    checkedAt: new Date().toISOString(),
  };
}

export interface TranscriptionRequestPayload {
  base64Audio: string;
  fileName: string;
  mimeType: string;
  clientId?: number;
  context?: string;
}

export interface TranscriptionResponse extends BaseModelResponse {
  transcript: string;
  durationSeconds?: number;
  confidence?: number;
}

export async function transcribeInteractionAudio(
  payload: TranscriptionRequestPayload,
): Promise<TranscriptionResponse> {
  const response = await postModelEndpoint<TranscriptionResponse>("/api/models/transcribe-audio", payload);
  return {
    ...response,
    transcript: response.transcript,
    traceId: response.traceId ?? randomId(),
  };
}

export interface SummarizationRequestPayload {
  transcript: string;
  clientId?: number;
  subject?: string;
}

export interface SummarizationResponse extends BaseModelResponse {
  summary: string;
  highlights?: string[];
}

export async function summarizeInteractionTranscript(
  payload: SummarizationRequestPayload,
): Promise<SummarizationResponse> {
  const response = await postModelEndpoint<SummarizationResponse>("/api/models/summarize-transcript", payload);
  return {
    ...response,
    summary: response.summary,
    traceId: response.traceId ?? randomId(),
  };
}
