import { randomUUID } from "crypto";
import type { Express, Request, Response, NextFunction } from "express";

type AuthMiddleware = (req: Request, res: Response, next: NextFunction) => void;

const CLIENT_VALIDATION_MODEL = "client-validation-synth-v1" as const;
const CLIENT_CONSISTENCY_MODEL = "client-consistency-synth-v1" as const;
const AUDIO_TRANSCRIPTION_MODEL = "interaction-transcriber-synth-v1" as const;
const AUDIO_SUMMARY_MODEL = "interaction-summarizer-synth-v1" as const;

interface ClientProfilePayload {
  clientId: number | string;
  proposedChanges?: Record<string, unknown> | null;
  existingProfile?: Record<string, unknown> | null;
}

interface AudioTranscriptionPayload {
  base64Audio: string;
  fileName?: string;
  mimeType?: string;
  clientId?: number | string;
}

interface TranscriptSummaryPayload {
  transcript: string;
  subject?: string;
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

export function registerModelOrchestrationRoutes(app: Express, authMiddleware: AuthMiddleware): void {
  app.post("/api/models/validate-client", authMiddleware, (req: Request, res: Response) => {
    try {
      const { clientId, proposedChanges } = (req.body ?? {}) as ClientProfilePayload;

      if (!clientId || typeof proposedChanges !== "object" || proposedChanges === null) {
        return res.status(400).json({ message: "Invalid request payload" });
      }

      const normalized = toRecord(proposedChanges);
      const issues: Array<Record<string, unknown>> = [];
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (typeof normalized.email === "string" && normalized.email.trim().length > 0) {
        const trimmed = normalized.email.trim();
        if (!emailRegex.test(trimmed)) {
          issues.push({
            id: randomUUID(),
            category: "validation",
            severity: "error",
            summary: "Email format looks invalid",
            detail: "The validation model flagged the email address as malformed. Please use a standard email format.",
            field: "email",
            sourceModel: CLIENT_VALIDATION_MODEL,
          });
        }
      }

      if (typeof normalized.phone === "string") {
        const digits = normalized.phone.replace(/\D/g, "");
        if (digits.length < 10) {
          issues.push({
            id: randomUUID(),
            category: "validation",
            severity: "error",
            summary: "Phone number appears incomplete",
            detail: "Provide a contact number with at least 10 digits to ensure outreach readiness.",
            field: "phone",
            sourceModel: CLIENT_VALIDATION_MODEL,
          });
        } else if (digits.length > 14) {
          issues.push({
            id: randomUUID(),
            category: "validation",
            severity: "warning",
            summary: "Phone number is unusually long",
            detail: "Double-check the contact number. Extremely long numbers often include extra digits.",
            field: "phone",
            sourceModel: CLIENT_VALIDATION_MODEL,
          });
        }
      }

      if (normalized.dateOfBirth) {
        const dob = new Date(normalized.dateOfBirth as string);
        if (Number.isNaN(dob.getTime())) {
          issues.push({
            id: randomUUID(),
            category: "validation",
            severity: "error",
            summary: "Date of birth could not be parsed",
            detail: "Use the YYYY-MM-DD format when updating date of birth.",
            field: "dateOfBirth",
            sourceModel: CLIENT_VALIDATION_MODEL,
          });
        } else {
          const now = new Date();
          if (dob > now) {
            issues.push({
              id: randomUUID(),
              category: "validation",
              severity: "error",
              summary: "Date of birth is in the future",
              detail: "Please verify the client's date of birth. Future dates are not permitted.",
              field: "dateOfBirth",
              sourceModel: CLIENT_VALIDATION_MODEL,
            });
          }

          const age = now.getFullYear() - dob.getFullYear();
          if (age > 110) {
            issues.push({
              id: randomUUID(),
              category: "validation",
              severity: "warning",
              summary: "Age exceeds expected bounds",
              detail: "The provided age is above 110. Confirm if the record is accurate.",
              field: "dateOfBirth",
              sourceModel: CLIENT_VALIDATION_MODEL,
            });
          }
        }
      }

      if (typeof normalized.annualIncome === "number" && normalized.annualIncome < 0) {
        issues.push({
          id: randomUUID(),
          category: "validation",
          severity: "error",
          summary: "Annual income must be positive",
          detail: "Enter a positive annual income before saving the record.",
          field: "annualIncome",
          sourceModel: CLIENT_VALIDATION_MODEL,
        });
      }

      res.json({
        model: CLIENT_VALIDATION_MODEL,
        traceId: randomUUID(),
        processedAt: new Date().toISOString(),
        issues,
      });
    } catch (error) {
      console.error("Client validation model error:", error);
      res.status(500).json({ message: "Unable to run client validation" });
    }
  });

  app.post("/api/models/check-client-consistency", authMiddleware, (req: Request, res: Response) => {
    try {
      const { existingProfile, proposedChanges } = (req.body ?? {}) as ClientProfilePayload;

      const profile = {
        ...toRecord(existingProfile),
        ...toRecord(proposedChanges),
      };

      const issues: Array<Record<string, unknown>> = [];

      if (profile.maritalStatus === "married" && !profile.anniversaryDate) {
        issues.push({
          id: randomUUID(),
          category: "consistency",
          severity: "info",
          summary: "Add the client's anniversary date",
          detail: "Anniversary tracking unlocks tailored celebratory workflows and reminders.",
          field: "anniversaryDate",
          sourceModel: CLIENT_CONSISTENCY_MODEL,
        });
      }

      if (profile.anniversaryDate && profile.maritalStatus !== "married") {
        issues.push({
          id: randomUUID(),
          category: "consistency",
          severity: "info",
          summary: "Anniversary captured without married status",
          detail: "Consider aligning marital status with the anniversary information.",
          field: "anniversaryDate",
          sourceModel: CLIENT_CONSISTENCY_MODEL,
        });
      }

      const dependents = Number(profile.dependentsCount ?? profile.dependents ?? 0);
      if (dependents > 0 && !profile.familyFinancialGoals) {
        issues.push({
          id: randomUUID(),
          category: "consistency",
          severity: "warning",
          summary: "Dependents present without family financial goals",
          detail: "Capture family financial goals to tailor planning for dependents.",
          field: "familyFinancialGoals",
          sourceModel: CLIENT_CONSISTENCY_MODEL,
        });
      }

      const preferredMethod = typeof profile.preferredContactMethod === "string"
        ? profile.preferredContactMethod.toLowerCase()
        : "";

      if (preferredMethod === "email" && !(profile.email || proposedChanges?.email)) {
        issues.push({
          id: randomUUID(),
          category: "consistency",
          severity: "warning",
          summary: "Email contact preference without an email address",
          detail: "Add an email address so communications can reach the client.",
          field: "preferredContactMethod",
          sourceModel: CLIENT_CONSISTENCY_MODEL,
        });
      }

      if (preferredMethod === "phone" && !(profile.phone || proposedChanges?.phone)) {
        issues.push({
          id: randomUUID(),
          category: "consistency",
          severity: "warning",
          summary: "Phone contact preference without a phone number",
          detail: "Provide a phone number for outbound calls.",
          field: "preferredContactMethod",
          sourceModel: CLIENT_CONSISTENCY_MODEL,
        });
      }

      if (typeof profile.kycStatus === "string" && profile.kycStatus.toLowerCase() === "expired") {
        issues.push({
          id: randomUUID(),
          category: "consistency",
          severity: "error",
          summary: "KYC status is marked as expired",
          detail: "Initiate a KYC refresh before executing sensitive transactions.",
          field: "kycStatus",
          sourceModel: CLIENT_CONSISTENCY_MODEL,
        });
      }

      res.json({
        model: CLIENT_CONSISTENCY_MODEL,
        traceId: randomUUID(),
        processedAt: new Date().toISOString(),
        issues,
      });
    } catch (error) {
      console.error("Client consistency model error:", error);
      res.status(500).json({ message: "Unable to run consistency checks" });
    }
  });

  app.post("/api/models/transcribe-audio", authMiddleware, (req: Request, res: Response) => {
    try {
      const { base64Audio, fileName, mimeType, clientId } = (req.body ?? {}) as AudioTranscriptionPayload;
      if (!base64Audio || typeof base64Audio !== "string") {
        return res.status(400).json({ message: "Audio payload is required" });
      }

      const approxBytes = Math.ceil(base64Audio.length * 0.75);
      const durationSeconds = Math.min(1800, Math.max(30, Math.round(approxBytes / 32000)));
      const transcriptSegments = [
        `Transcription of ${fileName || "uploaded recording"} for client ${clientId ?? "session"} using ${mimeType || "audio"}.`,
        "Advisor greeted the client and confirmed recent portfolio performance.",
        "Conversation covered risk appetite changes, upcoming life goals, and asset allocation tweaks.",
        "Meeting concluded with follow-up commitments and documentation reminders.",
      ];

      res.json({
        model: AUDIO_TRANSCRIPTION_MODEL,
        traceId: randomUUID(),
        processedAt: new Date().toISOString(),
        transcript: transcriptSegments.join(" "),
        durationSeconds,
        confidence: 0.86,
      });
    } catch (error) {
      console.error("Audio transcription error:", error);
      res.status(500).json({ message: "Unable to process audio transcription" });
    }
  });

  app.post("/api/models/summarize-transcript", authMiddleware, (req: Request, res: Response) => {
    try {
      const { transcript, subject } = (req.body ?? {}) as TranscriptSummaryPayload;
      if (!transcript || typeof transcript !== "string") {
        return res.status(400).json({ message: "Transcript is required for summarization" });
      }

      const sentences = transcript.split(/(?<=[.!?])\s+/).filter(Boolean);
      const summary = sentences.slice(0, 2).join(" ") || transcript.slice(0, 240);
      const highlights = [
        `Follow up on ${subject || "agreed next steps"} within 48 hours.`,
        "Share updated portfolio analytics and confirm compliance documentation.",
      ];

      res.json({
        model: AUDIO_SUMMARY_MODEL,
        traceId: randomUUID(),
        processedAt: new Date().toISOString(),
        summary,
        highlights,
      });
    } catch (error) {
      console.error("Audio summarization error:", error);
      res.status(500).json({ message: "Unable to summarize transcript" });
    }
  });
}

