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

## Phase 2: Vision Pipeline, Batch Ingestion & Error Resilience

- **AI Assistance:**
  - Proposed the initial boilerplate for calling the OpenRouter Vision API and calculating token costs.
  - Provided the mathematical formula for exponential backoff ($delay = base \times 2^{attempt - 1}$) and the initial wrapper structure for `withRetry`.
  - Assisted in clarifying low-level runtime mechanics: the event loop tick phases, microtasks vs. macrotasks, and how `libuv` delegates asynchronous I/O to the OS kernel.
  - Explained the historical language connections between JavaScript's first-class functions and Lisp/Scheme compared to low-level C memory models.

- **AI Limitations & Contextual Clarifications:**
  - The AI suggested running immediate asynchronous test executions, but I had to halt and deeply debug why `[AsyncFunction: res]` and `fn is not a function` occurred due to eager evaluation and uninvoked function references.
  - I caught a subtle bug where `return await fn(filePath)` was hardcoded inside `withRetry`, uncovering how JavaScript closures and argument-discarding behavior masked the parameter mismatch during batch execution.
  - I pushed back against blindly trusting `try/catch` and `setTimeout`, forcing an in-depth breakdown of process crashes (unhandled rejections vs. re-throws) and proving why non-blocking `sleep` promises do not cause event loop latency.

- **My Decisions & Engineering Actions (Human Owner):**
  - Reviewed, integrated, and verified `vision.service.js` and the validation flow with `zod`.
  - Audited the runtime behavior of `withRetry` and `sleep`, analyzing how the Event Loop and closures handled function parameters under test executions.
  - Implemented and executed the batch processing script (`src/scripts/batch-process.js`) using `better-sqlite3`, verifying the idempotency mechanism (`isImageProcessed`) across the 50-image dataset.
  - Inspected the SQLite database records and verified that attributes, confidence scores, and temporary embeddings were stored accurately to pass the Phase 2 Gate.