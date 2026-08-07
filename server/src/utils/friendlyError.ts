import Groq from "groq-sdk";
import { HttpError } from "./httpError.ts";

/**
 * Groq answers 429 both for the per-minute throttle and for an exhausted daily
 * quota. They need different advice — one is "wait a moment", the other is
 * "come back tomorrow" — so read which it was out of the error text.
 */
function rateLimitMessage(error: InstanceType<typeof Groq.APIError>): string {
  const detail = String(error.message ?? "").toLowerCase();
  const dailyQuotaSpent = /per day|\btpd\b|\brpd\b|daily limit/.test(detail);

  if (dailyQuotaSpent) {
    return (
      "This free practice server has hit its daily AI limit — a lot of people " +
      "have been interviewing today. Please come back tomorrow."
    );
  }

  return (
    "A lot of people are practicing right now, so the AI service is at " +
    "capacity. Wait about a minute and try again — your session is still here."
  );
}

export function friendlyError(error: unknown): { status: number; message: string } {
  if (error instanceof HttpError) {
    return { status: error.status, message: error.message };
  }

  if (error instanceof Groq.APIConnectionTimeoutError) {
    return { status: 504, message: "The AI service took too long to respond. Please try again." };
  }

  if (error instanceof Groq.APIError) {
    const status = typeof error.status === "number" ? error.status : 500;
    if (status === 401 || status === 403) {
      return {
        status: 500,
        message: "The server's AI credentials are invalid. Please contact the site owner."
      };
    }
    if (status === 429) {
      return { status: 429, message: rateLimitMessage(error) };
    }
    if (status >= 500) {
      return {
        status: 502,
        message: "The AI service is temporarily unavailable. Please try again shortly."
      };
    }
    return { status: 502, message: "The AI service rejected the request. Please try again." };
  }

  if (error instanceof Groq.APIConnectionError) {
    return { status: 502, message: "Could not reach the AI service. Please try again shortly." };
  }

  const message =
    error instanceof Error ? error.message : "The interview server hit an unexpected error.";
  return { status: 500, message };
}
