import test from "node:test";
import assert from "node:assert/strict";
import type { Connector, EvidencePassage } from "./domain.js";
import { respondToSmallTalk, retrieveEvidence, synthesizeAnswer } from "./pipeline.js";

test("responds to basic greetings without pretending they are sourced facts", () => {
  const answer = respondToSmallTalk("Hello!");
  assert.ok(answer);
  assert.match(answer.text, /Hello/i);
  assert.equal(answer.verified, false);
});

test("rejects unsupported and insecure links", async () => {
  const connector: Connector = { async resolveAndRetrieve() { return []; } };
  const result = await retrieveEvidence({
    connector,
    principal: { id: "u1", tenantId: "t1" },
    question: "What is the policy?",
    links: ["http://example.com/a", "https://example.com/b", "not-a-url"],
  });
  assert.equal(result.passages.length, 0);
  assert.equal(result.rejectedLinks.length, 3);
});

test("returns a limitation when no authorized evidence exists", () => {
  const answer = synthesizeAnswer({ passages: [], rejectedLinks: [] });
  assert.equal(answer.verified, false);
  assert.match(answer.text, /couldn't verify/i);
  assert.deepEqual(answer.citations, []);
});

test("keeps citations attached to verified passages", () => {
  const passage: EvidencePassage = {
    source: { kind: "google-drive", url: "https://drive.google.com/file/d/abc/view" },
    documentId: "doc-1",
    title: "Policy",
    text: "Retention is seven years.",
    retrievedAt: new Date().toISOString(),
  };
  const answer = synthesizeAnswer({ passages: [passage], rejectedLinks: [] });
  assert.equal(answer.citations[0]?.documentId, "doc-1");
  assert.equal(answer.verified, true);
});
