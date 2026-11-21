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
npm install
npm run build
npm test
npm start
```

## Security boundary

Retrieved content is data, never instructions. The connector receives the requesting principal and must enforce permissions before returning passages. The current unconfigured connector returns no evidence, so the service cannot fabricate an answer.
