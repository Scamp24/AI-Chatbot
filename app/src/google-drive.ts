import { createHash, randomBytes } from "node:crypto";
import type { Connector, EvidencePassage, Principal, SourceRef } from "./domain.js";

const DRIVE_SCOPE = "openid email https://www.googleapis.com/auth/drive.readonly";
const STATE_TTL_MS = 10 * 60 * 1000;
const GOOGLE_DOC = "application/vnd.google-apps.document";
const TEXT_TYPES = new Set(["text/plain", "text/markdown", "text/csv"]);
type OAuthState = { verifier: string; createdAt: number };
type GoogleToken = { accessToken: string; refreshToken?: string; expiresAt: number; subject?: string; email?: string };

export class GoogleDriveConnector implements Connector {
  private readonly pending = new Map<string, OAuthState>();
  private token?: GoogleToken;

  constructor(private readonly config: { clientId?: string | undefined; clientSecret?: string | undefined; redirectUri: string }) {}

  get configured(): boolean { return Boolean(this.config.clientId && this.config.clientSecret); }
  get status(): { configured: boolean; connected: boolean; email?: string } {
    return { configured: this.configured, connected: Boolean(this.token), ...(this.token?.email ? { email: this.token.email } : {}) };
  }
  get principal(): Principal | undefined { return this.token?.subject ? { id: this.token.subject, tenantId: "local-demo" } : undefined; }

  beginAuthorization(): string {
    if (!this.configured) throw new Error("google_oauth_not_configured");
    const verifier = randomBytes(32).toString("base64url");
    const state = randomBytes(24).toString("base64url");
    const challenge = createHash("sha256").update(verifier).digest("base64url");
    this.pending.set(state, { verifier, createdAt: Date.now() });
    const params = new URLSearchParams({ client_id: this.config.clientId!, redirect_uri: this.config.redirectUri, response_type: "code", scope: DRIVE_SCOPE, access_type: "offline", prompt: "consent", state, code_challenge: challenge, code_challenge_method: "S256" });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  async completeAuthorization(code: string, state: string): Promise<void> {
    const pending = this.pending.get(state);
    this.pending.delete(state);
    if (!pending || Date.now() - pending.createdAt > STATE_TTL_MS) throw new Error("invalid_oauth_state");
    const response = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ code, client_id: this.config.clientId!, client_secret: this.config.clientSecret!, redirect_uri: this.config.redirectUri, grant_type: "authorization_code", code_verifier: pending.verifier }) });
    if (!response.ok) throw new Error("google_oauth_exchange_failed");
    const body = await response.json() as { access_token?: string; refresh_token?: string; expires_in?: number };
    if (!body.access_token) throw new Error("google_oauth_missing_token");
    const profile = await this.googleRequest("https://www.googleapis.com/oauth2/v3/userinfo", body.access_token) as { sub?: string; email?: string };
    this.token = { accessToken: body.access_token, ...(body.refresh_token ? { refreshToken: body.refresh_token } : {}), expiresAt: Date.now() + (body.expires_in ?? 3600) * 1000, ...(profile.sub ? { subject: profile.sub } : {}), ...(profile.email ? { email: profile.email } : {}) };
  }

  async resolveAndRetrieve(input: { principal: Principal; source: SourceRef; question: string }): Promise<EvidencePassage[]> {
    return input.source.kind === "google-drive" ? this.retrieveQuestion(input.question) : [];
  }

  async retrieveQuestion(question: string): Promise<EvidencePassage[]> {
    const accessToken = await this.getAccessToken();
    if (!accessToken) return [];
    try {
      const filesResponse = await this.googleRequest("https://www.googleapis.com/drive/v3/files?" + new URLSearchParams({ q: "trashed = false", pageSize: "100", orderBy: "modifiedTime desc", fields: "files(id,name,mimeType,modifiedTime,webViewLink)" }), accessToken) as { files?: Array<{ id: string; name: string; mimeType: string; modifiedTime?: string; webViewLink?: string }> };
      const terms = question.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 2);
      const passages: EvidencePassage[] = [];
      for (const file of filesResponse.files ?? []) {
        if (passages.length >= 5 || (!TEXT_TYPES.has(file.mimeType) && file.mimeType !== GOOGLE_DOC)) continue;
        const text = await this.readFile(file.id, file.mimeType, accessToken);
        const lower = text.toLowerCase();
        const score = terms.reduce((count, term) => count + (lower.includes(term) ? 1 : 0), 0);
        if (score === 0) continue;
        const firstTerm = terms.find((term) => lower.includes(term));
        const index = firstTerm ? lower.indexOf(firstTerm) : 0;
        passages.push({ source: { kind: "google-drive", url: file.webViewLink ?? `https://drive.google.com/open?id=${file.id}`, canonicalId: file.id }, documentId: file.id, title: file.name, location: "Google Drive content", text: text.slice(Math.max(0, index - 180), Math.max(0, index - 180) + 900).trim(), ...(file.modifiedTime ? { lastModified: file.modifiedTime } : {}), retrievedAt: new Date().toISOString() });
      }
      return passages;
    } catch { return []; }
  }

  private async readFile(id: string, mimeType: string, accessToken: string): Promise<string> {
    const endpoint = mimeType === GOOGLE_DOC ? `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}/export?mimeType=text/plain` : `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?alt=media`;
    const response = await fetch(endpoint, { headers: { authorization: `Bearer ${accessToken}` } });
    return response.ok ? response.text() : "";
  }

  private async getAccessToken(): Promise<string | undefined> {
    if (!this.token) return undefined;
    if (this.token.expiresAt > Date.now() + 60_000) return this.token.accessToken;
    if (!this.token.refreshToken) return undefined;
    const response = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: this.config.clientId!, client_secret: this.config.clientSecret!, refresh_token: this.token.refreshToken, grant_type: "refresh_token" }) });
    if (!response.ok) return undefined;
    const body = await response.json() as { access_token?: string; expires_in?: number };
    if (!body.access_token) return undefined;
    this.token = { ...this.token, accessToken: body.access_token, expiresAt: Date.now() + (body.expires_in ?? 3600) * 1000 };
    return this.token.accessToken;
  }

  private async googleRequest(url: string, accessToken: string): Promise<unknown> {
    const response = await fetch(url, { headers: { authorization: `Bearer ${accessToken}` } });
    if (!response.ok) throw new Error(`google_api_request_failed_${response.status}`);
    return response.json();
  }
}
