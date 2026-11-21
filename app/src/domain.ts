export type SourceKind = "sharepoint" | "google-drive";

export interface Principal {
  id: string;
  tenantId: string;
}

export interface SourceRef {
  kind: SourceKind;
  url: string;
  canonicalId?: string;
}

export interface EvidencePassage {
  source: SourceRef;
  documentId: string;
  title: string;
  location?: string;
  text: string;
  lastModified?: string;
  retrievedAt: string;
}

export interface Connector {
  resolveAndRetrieve(input: {
    principal: Principal;
    source: SourceRef;
    question: string;
  }): Promise<EvidencePassage[]>;
}

export interface Answer {
  text: string;
  citations: EvidencePassage[];
  verified: boolean;
  caveat?: string;
}

export interface RetrievalResult {
  passages: EvidencePassage[];
  rejectedLinks: string[];
}
