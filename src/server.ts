import { createServer } from "node:http";
import { FailClosedConnector, retrieveEvidence, synthesizeAnswer } from "./pipeline.js";

const port = Number(process.env.PORT ?? 3000);
const connector = new FailClosedConnector();

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

const server = createServer(async (request, response) => {
  try {
    if (request.method === "GET" && request.url === "/health") {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ ok: true }));
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
    const result = await retrieveEvidence({
      connector,
      principal: { id: "anonymous", tenantId: "unconfigured" },
      question: body.question,
      links: body.links,
    });
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
