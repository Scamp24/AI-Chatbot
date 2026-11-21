import type { Answer, Connector, Principal, RetrievalResult } from "./domain.js";
import { parseSourceUrl, validateQuestion } from "./validation.js";

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
      text: "I couldn't verify that from the sources you provided.",
      citations: [],
      verified: false,
      caveat: "No permission-verified evidence was available. Check the link, your access, or provide a narrower question.",
    };
  }

  // The model-backed synthesizer will replace this in a later slice. Until then,
  // returning the evidence verbatim is safer than inventing a generated answer.
  return {
    text: "Verified passages were found, but answer synthesis is not configured yet.",
    citations: result.passages,
    verified: false,
    caveat: "The answer model is not configured; review the cited passages directly.",
  };
}

export class FailClosedConnector implements Connector {
  async resolveAndRetrieve(): Promise<never[]> {
    return [];
  }
}
