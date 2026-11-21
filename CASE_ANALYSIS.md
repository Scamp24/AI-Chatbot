# Enterprise AI Chatbot Case Analysis

**Audience:** IT Director and technology leadership  
**Reviewed:** 2026-11-20  
**Purpose:** Explain the difference between building an AI chatbot with coding agents and building one with Microsoft Copilot Studio, including integration, compliance, effort, distribution, and the recommended path for this project.

## Executive recommendation

For an organization already invested in Microsoft 365, Entra ID, Teams, SharePoint, and Microsoft Copilot, the recommended production path is **Copilot-first with a controlled extension point**:

1. Start with Microsoft Copilot Studio and Microsoft 365 identity.
2. Use Microsoft’s Google Drive connector where its permission model and supported file types meet the requirement.
3. Add custom code only when the business requirement cannot be met by native knowledge sources, connectors, REST APIs, or MCP tools.
4. If custom code is needed, expose it as a narrow, authenticated service behind a custom connector or REST API tool, or package it as a supported external/custom agent for Microsoft’s Agent Store process.

This is the lowest-risk route for permission handling, administration, Microsoft 365 distribution, and compliance. The custom application in this repository remains valuable as a prototype, a bespoke user experience, or a future custom-engine agent, but it should not become the production security boundary until identity, authorization, secrets, audit, retention, and model governance are implemented.

## The basic vocabulary

### Coding agent

A coding agent is a development tool that uses an AI model to read a codebase, edit files, run commands and tests, and prepare changes. Examples include OpenAI Codex, Claude Code, and Microsoft Copilot Code. They help developers build software; they are not the chatbot that the business users eventually use.

Codex and Claude Code can operate in a repository and use tools such as terminals, files, browser automation, or MCP servers. Microsoft Copilot Code similarly turns a natural-language request into software and can work locally or in an isolated cloud environment. These tools create the application; they do not automatically provide enterprise identity, data permissions, compliance, or a production LLM runtime.

### LLM or foundation model

The LLM is the language model that interprets a question and generates a response. Examples include models accessed through Azure OpenAI, the OpenAI API, Anthropic, or Microsoft-managed Copilot experiences.

A coding agent may use an LLM while developing the application. That does not mean the finished application automatically has access to that model. The finished application needs its own approved model endpoint, authentication, budget, data-processing terms, safety controls, and monitoring.

### AI chatbot or agent

An AI chatbot is the user-facing conversational experience. An agent is a broader version that can reason over knowledge, call tools, perform actions, and follow policies. The interface is only one part of the system.

### RAG: retrieval-augmented generation

RAG is a pattern, not a product. It normally works like this:

```text
User question
  -> identity and authorization
  -> retrieve permitted passages
  -> rank relevant evidence
  -> give evidence to the model
  -> generate an answer with citations
  -> validate claims and permissions
```

RAG does not automatically make data secure. The retrieval step must filter by the requesting user’s effective permissions before content reaches the model.

### Connector

A connector is an integration that lets an agent access another system such as SharePoint, Google Drive, Salesforce, or an internal API. A connector may use user credentials, delegated OAuth, maker-provided credentials, or a service identity. The choice changes the authorization risk.

### Knowledge source versus tool

- A **knowledge source** is content the agent searches to answer questions.
- A **tool** is an operation the agent can invoke, such as calling an API, creating a ticket, or retrieving a record.

Microsoft Copilot Studio supports connectors, REST APIs, custom connectors, agent flows, prompts, and MCP servers as tools. It can also use supported connectors as knowledge sources.

### Copilot Studio

Copilot Studio is Microsoft’s agent-authoring and deployment platform. It provides a managed authoring experience, connectors, authentication options, publishing channels, testing, and administrative controls. It is not the same thing as Microsoft 365 Copilot itself; Copilot Studio is the place where an organization can create and configure agents that can be used in Microsoft Copilot, Teams, SharePoint, websites, and other channels.

### Microsoft 365 Copilot

Microsoft 365 Copilot is Microsoft’s end-user Copilot experience inside Microsoft 365 applications and services. A Microsoft 365 Copilot license gives access to Copilot capabilities under Microsoft’s licensing and tenant controls. It does not function as a general-purpose API key that a custom web application can silently reuse.

### Agent Store

The Microsoft 365 Agent Store is a discovery and distribution surface. An organization can approve agents for its users, and eligible publishers can pursue broader distribution. An agent appearing in the store does not remove the need for authentication, authorization, connector consent, admin approval, licensing, data policies, or publisher review.

## Method 1: Build a custom chatbot with coding agents

### What this means

Codex, Claude Code, or Copilot Code helps developers create a normal software system. The system usually contains:

- a web or Teams user interface;
- an identity provider such as Microsoft Entra ID;
- connector code for SharePoint and Google Drive;
- a retrieval and authorization layer;
- a vector or search index, if indexing is used;
- an LLM endpoint such as Azure OpenAI, OpenAI, or Anthropic;
- citation and claim validation;
- logging, monitoring, deployment, secrets, and incident response.

The coding agent accelerates implementation and testing. The organization still owns the resulting architecture and operational risk.

### Strengths

- Full control over the user interface and workflow.
- Ability to combine Microsoft, Google, and proprietary systems in one product.
- Ability to choose the model, hosting region, retrieval technology, and evaluation approach.
- Easier to implement product-specific features that Copilot Studio does not support.
- Can expose a controlled API later to Copilot Studio or other agent platforms.

### Constraints

- The team must implement and prove identity propagation, authorization order, tenant isolation, token storage, revocation, audit, retention, deletion, rate limits, availability, and disaster recovery.
- A model API key and connector credentials must be separately governed.
- A successful answer is not evidence that the authorization design is correct.
- The organization owns model and connector outages, prompt injection defenses, data leakage tests, and support.
- Distribution through Microsoft’s Agent Store requires additional packaging and approval; the existence of a web app is not enough.

### Compliance and security effort

The custom approach requires security review of:

- Entra application registration, redirect URIs, scopes, conditional access, and session handling;
- Google OAuth delegated permissions and token storage;
- whether data is indexed, where it is stored, and how it is deleted;
- whether model prompts or logs contain sensitive content;
- prompt injection, data exfiltration, cross-tenant leakage, stale permissions, and citation mismatch;
- vendor contracts, data residency, retention, subprocessors, and incident response;
- administrator access to connectors and knowledge sources.

## Method 2: Build with Microsoft Copilot Studio

### What this means

The organization creates an agent in Copilot Studio, configures instructions and knowledge, adds connectors or tools, tests it, publishes it to selected channels, and submits it for Microsoft 365 admin approval.

Users can authenticate with Microsoft Entra ID. Copilot Studio supports Microsoft authentication and manual OAuth configurations, and connectors can use user authentication or maker-provided credentials depending on the scenario.

### Strengths

- Native integration with Microsoft 365, Teams, SharePoint, Entra ID, and Microsoft administration.
- Faster path to an internal pilot.
- Existing connector and identity patterns reduce custom code.
- Built-in publishing, testing, sharing, and admin approval workflows.
- The Microsoft 365 Google Drive connector is designed to index Drive content while preserving Drive ACLs through identity mapping.
- Easier for IT administrators and business makers to maintain than a bespoke application.

### Constraints

- The organization is constrained by Microsoft’s supported channels, connector capabilities, licensing, capacity, data policies, and product roadmap.
- Advanced custom retrieval, ranking, UI, evaluation, and workflow behavior may require custom tools or external services.
- Connector credential mode must be chosen carefully. Maker-provided credentials can create a broad access path if used without strong governance.
- Preview features can change and should not be treated as production foundations without review.
- A Copilot license does not remove the need for tenant configuration, connector permissions, data policies, and admin approval.

### Compliance and security effort

Microsoft manages much of the platform boundary, but the organization still owns:

- tenant and environment governance;
- Entra groups, role assignments, maker permissions, and admin approval;
- connector authentication mode and data-loss-prevention policies;
- source permission mapping and validation;
- knowledge-source classification, retention, and deletion decisions;
- review of prompts, tools, API actions, and external data flows;
- licensing, Copilot Credits, capacity, and cost controls;
- testing for unauthorized retrieval and unsafe actions.

## Can external code be integrated into a Copilot agent?

**Yes, but not by simply uploading an arbitrary repository and making it an Agent Store listing.** The external code must be exposed through supported Microsoft integration and distribution mechanisms.

### Option A: Custom connector

Expose a narrow HTTPS API from the custom application and describe it with a Power Platform custom connector. Copilot Studio can call that connector as a tool. Authentication, scopes, tenant boundaries, input validation, and output contracts must be explicitly configured.

This is appropriate when the existing application owns specialized business logic or retrieval that Copilot Studio cannot perform itself.

### Option B: REST API tool

Copilot Studio can add an external REST API as a tool using an OpenAPI specification, authentication details, and descriptions that explain when the model should call the API. Microsoft currently documents this capability as preview, so it requires extra lifecycle and production-readiness review.

### Option C: MCP server

Copilot Studio supports MCP as a tool mechanism in applicable experiences. An external MCP server can expose carefully scoped tools and resources. It must still have strong authentication, authorization, auditing, rate limits, and data minimization.

### Option D: Custom engine or external-platform agent

An agent built with custom code, Azure AI Foundry, the OpenAI Agents SDK, or another supported platform can be brought into Microsoft’s agent ecosystem through the applicable Microsoft agent integration and packaging path. Microsoft’s current Agent Store guidance lists “bring agents from external platforms” and Agent 365 SDK integration as supported deployment patterns, subject to prerequisites and admin controls.

This does not mean Microsoft automatically hosts or secures the external application. The organization or publisher remains responsible for the external runtime, model, identity, secrets, APIs, logging, and compliance boundary.

### Agent Store versus commercial marketplace

- **Organizational Agent Store:** An internal administrator reviews and makes agents available to selected users, groups, or the organization.
- **Microsoft commercial marketplace:** A broader publisher distribution path that requires appropriate packaging, publisher access, listing information, review, and customer installation/consent.

An organization can publish an internally built agent for internal users without making it a public commercial product. Public marketplace distribution has materially higher publisher, support, security, privacy, and lifecycle requirements.

## Comparison

| Dimension | Custom application | Copilot Studio / Microsoft-native |
|---|---|---|
| User experience | Maximum control | Microsoft channels and supported customization |
| Identity | Built by the project team | Entra and Microsoft channel integration available |
| Google Drive | Custom OAuth/connector or external service | Native connector or Power Platform connector options |
| Permission risk | Primarily owned by the project team | Reduced platform burden, still requires correct mapping and configuration |
| Model | Choose and operate an approved model provider | Microsoft-managed Copilot runtime and supported agent models |
| Retrieval | Fully custom | Managed knowledge and connector patterns, with extension points |
| Time to pilot | Medium to long | Shorter if requirements fit the platform |
| Ongoing operations | High | Lower platform operations, ongoing governance still required |
| Cost model | Hosting, model, storage, connectors, operations | Licenses, Copilot Studio/Copilot Credits, connectors, and possible Azure services |
| Best fit | Differentiated product or cross-platform experience | Internal enterprise assistant using Microsoft 365 controls |

## Effort estimate by workstream

### Custom application

- Product and UX: medium
- Identity and authorization: high
- Connectors and permission mapping: high
- Retrieval/indexing/evaluation: high
- Model integration and safety: medium to high
- Deployment and operations: high
- Compliance evidence: high

### Copilot Studio

- Product and UX: low to medium
- Identity and channel setup: low to medium
- Connector and knowledge configuration: medium
- Custom business actions: medium
- Retrieval customization: low to medium
- Deployment and operations: low to medium
- Compliance evidence: medium, with tenant governance still required

## Recommended phased strategy

### Phase 1: Validate the native path

1. Confirm the organization has Microsoft 365, Entra ID, Copilot Studio access, and the required Copilot licensing or Copilot Credits model.
2. Configure a non-production Copilot Studio environment.
3. Configure the Microsoft Google Drive connector with the recommended permission-preserving identity mapping.
4. Create a small internal agent with read-only knowledge access.
5. Test denied access, revoked access, stale documents, conflicting documents, prompt injection, and citation behavior.
6. Submit the agent to the Microsoft 365 admin approval process for a limited pilot group.

### Phase 2: Add custom code only where justified

If native features cannot meet a requirement, retain the custom code as a narrow service. Expose only the required operations through a custom connector, REST API, or MCP server. Keep user identity and authorization explicit at every call.

### Phase 3: Decide whether a standalone branded app is justified

Choose a custom front end only if the business needs a differentiated experience, cross-platform access, specialized workflow, or retrieval behavior that Microsoft channels cannot provide. At that point, the custom app should use enterprise identity and an approved model platform rather than treating a user’s Copilot license as a reusable API credential.

## Final architecture decision

The architect recommendation is **Copilot-first, custom-code-when-needed**:

- Use Microsoft Copilot Studio and the Microsoft 365 Agent Store for the primary internal distribution path.
- Use Microsoft Entra authentication and Microsoft-managed channel identity.
- Prefer the native Google Drive connector when its ACL mapping and supported formats satisfy the business requirement.
- Treat this repository as a prototype and a possible custom retrieval service, not the first production security boundary.
- If custom code is retained, expose it through a narrow, authenticated API/tool and submit the resulting agent through Microsoft’s review and approval path.

This recommendation minimizes duplicated enterprise controls while preserving an escape hatch for specialized logic. It also lets the organization prove the permission model and user value before investing in a full custom chatbot platform.

## Questions for the IT Director

1. Does the organization already have Microsoft 365 Copilot, Copilot Studio, or Copilot Credits available?
2. Is the intended audience internal employees only, or will external customers use the agent?
3. Is the primary channel Microsoft Copilot/Teams, or is a standalone branded web application mandatory?
4. Must Google Drive remain the system of record, or may content be indexed into Microsoft’s search/indexing layer?
5. Which data classifications are allowed, and which sources are prohibited from model processing?
6. Does the organization permit external model providers, or must the model remain in Microsoft/Azure boundaries?

## Official references

- [Microsoft 365 Agent Store](https://learn.microsoft.com/en-us/microsoft-365-copilot/copilot-agent-store)
- [Microsoft Google Drive connector](https://learn.microsoft.com/en-us/microsoft-365/copilot/connectors/google-drive-overview)
- [Copilot Studio authentication](https://learn.microsoft.com/en-us/microsoft-copilot-studio/configuration-fundamentals)
- [Copilot Studio connectors](https://learn.microsoft.com/en-us/microsoft-copilot-studio/copilot-ai-plugins)
- [Copilot Studio REST API tools](https://learn.microsoft.com/en-us/microsoft-copilot-studio/agent-extend-action-rest-api)
- [Copilot Studio connections](https://learn.microsoft.com/en-us/microsoft-copilot-studio/authoring-connections)
- [OpenAI Codex](https://developers.openai.com/learn/codex)
- [Anthropic Claude Code CLI reference](https://docs.anthropic.com/en/docs/claude-code/cli-usage)
