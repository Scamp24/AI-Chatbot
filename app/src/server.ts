import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleDriveConnector } from "./google-drive.js";
import { FailClosedConnector, retrieveEvidence, synthesizeAnswer } from "./pipeline.js";

const port = Number(process.env.PORT ?? 3000);
const connector = new FailClosedConnector();
const googleDrive = new GoogleDriveConnector({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI ?? `http://localhost:${port}/oauth/google/callback`,
});
const appDirectory = fileURLToPath(new URL(".", import.meta.url));

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

const server = createServer(async (request, response) => {
  try {
    if (request.method === "GET" && request.url === "/") {
      const html = await readFile(join(appDirectory, "..", "public", "index.html"), "utf8");
      response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      response.end(html);
      return;
    }
    if (request.method === "GET" && request.url === "/admin") {
      const html = await readFile(join(appDirectory, "..", "public", "admin", "index.html"), "utf8");
      response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      response.end(html);
      return;
    }
    if (request.method === "GET" && request.url === "/health") {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ ok: true }));
      return;
    }
    if (request.method === "GET" && request.url === "/api/admin/google/status") {
      const output = json(200, googleDrive.status);
      response.writeHead(output.status, Object.fromEntries(output.headers));
      response.end(await output.text());
      return;
    }
    if (request.method === "GET" && request.url === "/api/admin/google/start") {
      if (!googleDrive.configured) {
        const output = json(503, { error: "google_oauth_not_configured" });
        response.writeHead(output.status, Object.fromEntries(output.headers));
        response.end(await output.text());
        return;
      }
      response.writeHead(302, { location: googleDrive.beginAuthorization() });
      response.end();
      return;
    }
    if (request.method === "GET" && request.url?.startsWith("/oauth/google/callback")) {
      const callbackUrl = new URL(request.url, `http://localhost:${port}`);
      const code = callbackUrl.searchParams.get("code");
      const state = callbackUrl.searchParams.get("state");
      if (!code || !state) throw new Error("invalid_oauth_callback");
      await googleDrive.completeAuthorization(code, state);
      response.writeHead(302, { location: "/admin?connected=1" });
      response.end();
      return;
    }
    if (request.method !== "POST" || request.url !== "/ask") {
      const result = json(404, { error: "not_found" });
      response.writeHead(result.status, Object.fromEntries(result.headers));
      response.end(await result.text());
      return;
    }

    const chunks: Buffer[] = [];
    for await (const chunk of request) chunks.push(Buffer.from(chunk));
    const body = JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<string, unknown>;
    const result = body.links === undefined
      ? { passages: await googleDrive.retrieveQuestion(typeof body.question === "string" ? body.question : ""), rejectedLinks: [] }
      : await retrieveEvidence({ connector, principal: googleDrive.principal ?? { id: "anonymous", tenantId: "unconfigured" }, question: body.question, links: body.links });
    const answer = synthesizeAnswer(result);
    const output = json(200, { answer, rejectedLinks: result.rejectedLinks });
    response.writeHead(output.status, Object.fromEntries(output.headers));
    response.end(await output.text());
  } catch (error) {
    const output = json(400, { error: error instanceof Error ? error.message : "invalid_request" });
    response.writeHead(output.status, Object.fromEntries(output.headers));
    response.end(await output.text());
  }
});

server.listen(port, () => console.log(`AI Chatbot API listening on http://localhost:${port}`));
