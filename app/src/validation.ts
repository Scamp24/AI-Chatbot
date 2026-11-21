import type { SourceKind, SourceRef } from "./domain.js";

const SHAREPOINT_HOST = /(^|\.)sharepoint\.com$/i;
const DRIVE_HOST = /(^|\.)drive\.google\.com$/i;

export function parseSourceUrl(value: string): SourceRef | undefined {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return undefined;

    let kind: SourceKind | undefined;
    if (SHAREPOINT_HOST.test(url.hostname)) kind = "sharepoint";
    if (DRIVE_HOST.test(url.hostname)) kind = "google-drive";
    if (!kind) return undefined;

    return { kind, url: url.toString() };
  } catch {
    return undefined;
  }
}

export function validateQuestion(question: unknown): string {
  if (typeof question !== "string") throw new Error("question must be a string");
  const normalized = question.trim();
  if (normalized.length < 3 || normalized.length > 2000) {
    throw new Error("question must contain between 3 and 2000 characters");
  }
  return normalized;
}
