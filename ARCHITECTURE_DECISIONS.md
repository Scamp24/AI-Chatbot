# Architecture Decisions

## ADR-001: Separate client and admin surfaces

- **Status:** Approved for demo; production security approval pending.
- **Decision:** Use `/` for end-user chat and `/admin` for source administration in the first demo. Keep the boundary explicit in navigation, copy, and server routes. A future deployment may use separate origins such as `chat.example.com` and `admin.example.com`.
- **Rationale:** Administration is a privileged control plane with different identity, audit, and threat requirements. A separate surface reduces accidental privilege mixing and gives us a clear migration path to separate origins.
- **Constraints:** The local demo admin gate is not real authentication. No real team users or sensitive source configuration may be enabled until the CISO gates are met.

## ADR-002: OAuth instead of credential collection

- **Status:** Approved for design; implementation intentionally stubbed.
- **Decision:** Google Drive connections will use OAuth 2.0 Authorization Code with PKCE and least-privilege delegated scopes. The admin UI will start a provider-hosted authorization flow and never collect a Google password, refresh token, or client secret.
- **Rationale:** This preserves user consent, supports revocation, avoids secret handling in the browser, and allows authorization to remain tied to the requesting identity.
- **Constraints:** Client ID, redirect URI, secret storage, callback validation, token encryption, revocation, and audit logging are deployment concerns and are not simulated as completed.

## ADR-003: Demo status over simulated success

- **Status:** Approved.
- **Decision:** The demo shows connection state and the next secure action without pretending that Google Drive is connected. The API returns explicit unconfigured states.
- **Rationale:** A convincing fake connector would violate the project's trust and hallucination guardrails.

## ADR-004: Admin-connected Google Drive retrieval

- **Status:** Approved for local demo; production security approval pending.
- **Decision:** The admin portal starts Google OAuth 2.0 Authorization Code with PKCE. The client chat accepts only a question; retrieval uses the currently connected delegated Google identity and performs an answer-time Drive search.
- **Rationale:** Source setup belongs in the control plane, while end users should not have to paste links for an administrator-approved knowledge source. Answer-time retrieval preserves current Drive permissions for the connected identity.
- **Constraints:** This demo stores tokens only in process memory and has no production admin authentication, multi-user tenant isolation, encrypted token store, revocation workflow, or model synthesis. It must not be exposed as a team service.
