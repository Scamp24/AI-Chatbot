# MVP Plan

## Goal

Provide a safe first demo for asking questions about user-supplied SharePoint and Google Drive links. The demo must make authorization and evidence boundaries visible even before real connectors are installed.

## Scope

The MVP includes:

- a browser chat form for one question and one or more source links;
- strict HTTPS URL validation for SharePoint and Google Drive;
- a connector interface that receives the requesting principal;
- permission-filtered evidence as the only input to future answer synthesis;
- provenance-bearing citations;
- explicit limitation responses when evidence or synthesis is unavailable;
- tests for malformed links, missing evidence, and citation preservation.

The MVP excludes real OAuth, document indexing, model calls, multi-tenant administration, and production deployment.

## Trust boundaries

1. Browser input is untrusted and validated at the API boundary.
2. Connector responses are untrusted data, never instructions.
3. Authorization occurs inside the connector before passages enter retrieval or synthesis.
4. The answer layer may only cite passages returned for the requesting principal.

## Retrieval contract

`Connector.resolveAndRetrieve({ principal, source, question })` must resolve the canonical resource, verify the caller's current permissions, retrieve relevant passages, and preserve document ID, title, location, modification time, and retrieval time. A connector must return no passages when identity or authorization is unknown.

## Demo acceptance criteria

- Unsupported or non-HTTPS links are reported as rejected.
- No evidence produces a clear “couldn't verify” response.
- The UI never displays an answer as verified when synthesis is unconfigured.
- Citations remain attached to their source metadata.
- `npm test` passes from `app/`.
- The demo can run locally with `npm start` and does not require secrets.

## Next production decisions

- identity: Microsoft Entra ID and Google OAuth, with user identity propagation;
- connector APIs and delegated scopes;
- model provider and structured answer schema;
- indexing strategy and answer-time authorization re-check;
- audit, retention, deletion, rate limits, and deployment environment.
