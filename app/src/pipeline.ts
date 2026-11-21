import type { Answer, Connector, Principal, RetrievalResult } from "./domain.js";
import { parseSourceUrl, validateQuestion } from "./validation.js";

export function respondToSmallTalk(question: unknown): Answer | undefined {
  if (typeof question !== "string") return undefined;
  const normalized = question.trim().toLowerCase().replace(/[!?.,]+$/g, "");
  if (!/^(hi|hello|hey|good morning|good afternoon|good evening|how are you|thanks|thank you)$/.test(normalized)) return undefined;
  const text = normalized.startsWith("thank") ? "You're welcome. Ask me about the connected knowledge when you're ready." : "Hello. I'm ready to search the connected knowledge for you.";
  return { text, citations: [], verified: false, caveat: "I will ground substantive answers in permission-verified source evidence." };
}

export async function retrieveEvidence(args: {
  connector: Connector;
  principal: Principal;
  question: unknown;
  links: unknown;
}): Promise<RetrievalResult> {
  const question = validateQuestion(args.question);
  if (!Array.isArray(args.links) || args.links.length === 0 || args.links.length > 20) {
    throw new Error("links must contain between 1 and 20 URLs");
  }

  const sources = args.links
    .filter((link): link is string => typeof link === "string")
    .map(parseSourceUrl);
  const validSources = sources.filter((source): source is NonNullable<typeof source> => source !== undefined);
  const rejectedLinks = args.links.filter((link) => typeof link !== "string" || parseSourceUrl(link) === undefined) as string[];
  const passages = (await Promise.all(validSources.map((source) =>
    args.connector.resolveAndRetrieve({ principal: args.principal, source, question }),
  ))).flat();

  return { passages, rejectedLinks };
}

export function synthesizeAnswer(result: RetrievalResult): Answer {
  if (result.passages.length === 0) {
    return {
      text: "I couldn't verify that from the connected knowledge.",
      citations: [],
      verified: false,
      caveat: "No permission-verified evidence was available. Check the admin connection or try a narrower question.",
    };
  }

  const excerpts = result.passages.slice(0, 3).map((passage) => `• ${passage.text}`).join("\n\n");
  return {
    text: `Relevant verified passages:\n\n${excerpts}`,
    citations: result.passages,
    verified: true,
    caveat: "This demo shows retrieved evidence directly; generated answer synthesis is not configured.",
  };
}

export class FailClosedConnector implements Connector {
  async resolveAndRetrieve(): Promise<never[]> {
    return [];
  }
}
