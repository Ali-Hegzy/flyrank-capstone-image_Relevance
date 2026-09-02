## Phase 1: Setup, Schemas & Data Contracts (Design)

- **AI Assistance:**
  - Provided the mathematical implementation and code for the native `cosineSimilarity` function.
  - Recommended using SQLite over external Vector DBs for this corpus size (~50 images).
  - Drafted the initial SQL table definitions and guided the structure for `DESIGN.md`.
  - The AI initially explained advanced vector databases and embeddings, and take his opinion to choose SQLite over a VectorDB

- **AI Limitations & Contextual Clarifications:**
  - I had to pause the AI to clarify the actual role of a Backend engineer versus an AI engineer in this pipeline.
  - I stopped the AI from generating code for complex review/audit tables (`suggestions`, `ai_usage_logs`) to focus first on the two core tables (`images`, `posts`).

- **My Decisions & Engineering Actions (Human Owner):**
  - Designed and created the project architecture and folder structure (`src/controllers`, `src/middleware`, `src/schema`).
  - Wrote the runtime validation schema using `zod` (`visionModel`) based on the project spec.
  - Decided to adopt SQLite as the storage engine and manually set up the `images` and `posts` tables.
  - Rejected automatic image scraping scripts provided by AI to avoid licensing issues; instead, personally inspected and downloaded royalty-free images from Unsplash under their license.
  - Authored and committed `DESIGN.md` to pass the Phase 1 Gate.