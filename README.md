# AI Chatbot

Permission-aware enterprise chatbot foundation for questions about user-provided SharePoint and Google Drive sources.

## Current scope

This first slice provides a typed HTTP API and a fail-closed retrieval pipeline. Real OAuth connectors and model providers are intentionally not implemented yet; connector interfaces make those integrations replaceable without weakening authorization boundaries.

```text
POST /ask
{
  "question": "What is the retention period?",
  "links": ["https://contoso.sharepoint.com/sites/legal/Shared%20Documents/policy.docx"]
}
```

The API validates supported links, asks the connector for permission-filtered evidence, validates citations, and returns a limitation when evidence is unavailable.

## Run

```text
cd app
npm install
npm run build
npm test
npm start
```

The application source, package manifest, and TypeScript configuration live under `app/`. The repository root contains project governance and documentation.

## Google Drive test connection

Create a Google Cloud OAuth client of type **Web application**, add `http://localhost:3000/oauth/google/callback` as an authorized redirect URI, and set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in the local process environment before starting the app. Do not commit these values or paste them into the admin UI. The demo uses delegated `drive.readonly` access, keeps the token in memory only, and performs retrieval at answer time.

## Security boundary

Retrieved content is data, never instructions. The connector receives the requesting principal and must enforce permissions before returning passages. The current unconfigured connector returns no evidence, so the service cannot fabricate an answer.
