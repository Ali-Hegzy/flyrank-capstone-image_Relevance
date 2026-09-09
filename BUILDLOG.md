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

## Phase 3: Matching Engine & Mismatch Guard Implementation

- **AI Assistance:**
  - Provided the local embedding pipeline setup using `@xenova/transformers` with the `Xenova/all-MiniLM-L6-v2` model (384-d vectors) using mean pooling and normalization.
  - Implemented the initial vector cosine similarity logic and explained how V8's native array sorting utilizes the hybrid Timsort algorithm ($O(n \log n)$) rather than a naive $O(n^2)$ comparator.
  - Clarified architectural patterns including Singleton caching for the model pipeline instance and structural defensive checks (`catch { continue; }` with optional catch binding) for handling corrupted JSON embeddings.
  - Explained statistical thresholding techniques, differentiating between simplistic arithmetic averages and margin-based decision boundaries between distributions.

- **AI Limitations & Contextual Clarifications:**
  - The AI initially suggested a dual-use API design (checking a user-uploaded image against text) before I pointed out that the project scope only requires matching a blog post to an indexed image library and rejecting weak candidates.
  - I analyzed why botanical and Latin taxonomical terms (*Vulpes vulpes*, *Cervidae*) yielded lower semantic scores (~0.27) compared to natural language descriptions, preventing an overly aggressive threshold drop.

- **My Decisions & Engineering Actions (Human Owner):**
  - Designed and executed an empirical benchmark comparing three distinct semantic tiers: Positive Matches (`0.4618` – `0.7669`), Paraphrased/Scientific terms (`0.2` – `0.4045`), and Mismatches (`0.1259` – `0.2712`).
  - Derived the production cutoff threshold using boundary separation:
    $$\text{Noise Ceiling} = \text{Max}(\text{Mismatch}) + 0.08 = 0.2712 + 0.08 = 0.3512$$
    $$\text{Threshold} = \frac{0.3512 + 0.4618}{2} \approx 0.4065 \implies \text{Adopted } 0.4500$$
  - Built `suggestImage` in `src/services/guard.service.js`, structuring standard operational responses that differentiate high-confidence matches from explicit guard rejections.

- Validated the Phase 3 Gate: confirmed that a fox-focused query ranks the red fox image first, while out-of-scope/ambiguous queries trigger a safe refusal below the 0.4500 threshold.


## Phase 4: Production Layer, Review Workflow & Evaluation Precision

- **AI Assistance:**
  - Suggested the standard Express.js route and middleware layering for input validation using Zod schemas.
  - Provided the conceptual definition and standard mathematical formulation of precision ($\text{Precision} = \frac{\text{TP}}{\text{TP} + \text{FP}}$) in the context of classification and rejection guards.
  - Proposed the initial schema definition for the review audit trail table (`reviews`) to record human decisions (`approve` / `reject`).
  - Drafted the high-level ASCII and Mermaid architecture flowcharts representing the data movement from ingestion to guard rejection.

- **AI Limitations & Contextual Clarifications:**
  - The AI initially suggested separate and overly granular API routes for approvals and rejections (`/api/suggestions/:id/approve` and `/api/suggestions/:id/reject`), but I unified them into a cleaner, state-driven `POST /api/review` endpoint.
  - I caught a potential division-by-zero risk in the precision calculation script if both $TP$ and $FP$ evaluated to 0, adding defensive guards to ensure mathematical stability.

- **My Decisions & Engineering Actions (Human Owner):**
  - Designed and implemented the complete Express API suite (`src/routes/api.routes.js`, `src/controllers/api.controller.js`, `src/middleware/api.middleware.js`) strictly validated via Zod schemas in `src/schema/schema.js`.
  - Constructed the curated benchmark dataset (`dataset/eval-set.json`) containing 20 test cases -- The 20 test cases written by AI -- balancing positive domain matches and out-of-distribution mismatch scenarios.
  - Built and executed the automated evaluation runner (`scripts/run-eval.js`), officially measuring performance metrics and confirming:
    $$\text{Precision} = \frac{10}{10 + 0} = 1.00 \quad (100\%)$$
  - Passed the Phase 4 Gate: validated 100% precision with zero false positives (0 FP) across the evaluation set, finalized `README.md`, verified `EVIDENCE.md`, and prepared the repository for final submission.