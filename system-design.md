# System Design: Rent & Flatmate Finder

## 1. AI Compatibility Scoring Design
The core value proposition of the platform is matching tenants to owners not just on raw filters, but on nuanced compatibility. 

**Workflow:**
- Tenants maintain a `TenantProfile` with location, budget constraints, and free-form lifestyle notes.
- Owners maintain `RoomListing` details including rent, location, and description.
- When a tenant views listings or sends an "Interest" request, the system computes an AI Compatibility Score.
- To prevent abuse and reduce API costs, scores are **persisted** in a `CompatibilityScore` table linking a `userId` and a `listingId`. 
- Scores are lazy-loaded: they are only computed when specifically requested or when an interest is initiated.
- If a tenant updates their profile or an owner updates their listing, an automated trigger marks all their associated `CompatibilityScore` records as `needsRescore = true`. The next time that pairing is evaluated, a fresh score is computed and cached.

## 2. LLM Integration and Fallback
The AI scoring engine is built with resilience and extensibility in mind.

**Integration:**
- The engine supports multiple providers (currently Gemini and OpenAI) via a configurable environment variable (`LLM_PROVIDER`).
- A highly structured prompt is sent to the LLM, passing the listing attributes and tenant preferences as JSON strings to prevent prompt injection.
- The prompt explicitly requests a JSON output format containing a numeric `score` (0-100) and a brief `explanation` string.

**Fallback Mechanism:**
- The system assumes LLMs can be slow or unavailable. Every LLM request is wrapped in a strict **8-second timeout promise race**.
- If the LLM throws an error (e.g., rate limit, invalid JSON response) or the 8-second timeout is breached, the system catches the exception and immediately invokes a `ruleBasedFallback`.
- The `ruleBasedFallback` is a deterministic, locally executed function that computes a score based on substring location matching (up to 50 points) and budget proximity (up to 50 points). It generates a standard explanatory string.
- This guarantees that the user flow (sending an interest, rendering a match) **never crashes or blocks indefinitely** due to external API failures. The DB records the `scoringMethod` as either `LLM` or `FALLBACK` for analytics.

## 3. Real-Time Chat Implementation
Once an owner accepts a tenant's interest, a private communication channel is established.

**Architecture:**
- Built using **Socket.IO** attached to the existing Express HTTP server.
- Clients connect to the `/chat` namespace. Authentication is enforced on the socket connection using the same JWT strategy as the REST API to ensure secure access.
- When an owner accepts an interest, a unique `interestId` serves as the `roomId`. Both the tenant and the owner join this isolated Socket.IO room.

**Message Persistence:**
- The chat is not ephemeral. When a user emits a `send_message` event, the backend first validates the payload and verifies the user is part of that `interestId` pair.
- The message is then written to the database (`ChatMessage` model) via Prisma.
- Only after successful database insertion is the message broadcasted to the room via `io.to(roomId).emit('receive_message', savedMessage)`. This guarantees no data loss and allows users to retrieve chat history upon reconnecting.

## 4. Notification Flow
To keep users engaged, email notifications are dispatched on critical lifecycle events.

**Triggers:**
1. **High Compatibility Interest:** When a tenant expresses interest in a room, the system checks the compatibility score. If the score is > 80 (indicating a strong match), an email is immediately dispatched to the owner highlighting the tenant's profile and the AI explanation.
2. **Status Updates:** When an owner Accepts or Declines an interest, an email is dispatched to the tenant informing them of the decision.

**Email Service Integration:**
- The notification system uses `nodemailer`. 
- In production, it connects to a configured SMTP server via `.env` variables.
- In development/testing environments (where SMTP configs are missing), the system intercepts the initialization and automatically provisions a free-tier **Ethereal Email** test account. 
- It logs the Ethereal credentials and the sent-message preview URLs directly to the terminal, allowing developers to inspect the generated HTML emails without setting up mail servers.
- A `NotificationLog` table records all dispatch attempts (SUCCESS or FAILED) ensuring auditability. All email dispatches are wrapped in `try/catch` blocks to prevent SMTP failures from interrupting the main application threads.
