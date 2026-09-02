# System Design Document: AI Image Matching Engine with Mismatch Guard

## 1. Problem Statement
Editorial workflows frequently require matching relevant visual assets to written articles. Traditional keyword or filename searches fail when concepts diverge lexically (e.g., matching "Vulpes vulpes" to a "red fox" image) or when visually similar entities create false positives (e.g., serving a wolf image for a fox article).

The goal of this system is to build a reliable backend engine that indexes images by semantic meaning rather than metadata, ranks candidates against article content, and enforces a strict safety layer (**Mismatch Guard**). The engine prioritizes safe rejection over incorrect recommendations: when confidence or semantic alignment fails, it refuses the match with a transparent explanation.

---

## 2. Architecture & Data Flow

1. **Images Pipeline:** Local images -> Vision LLM -> Schema Validation (Zod) -> Embedding Model -> SQLite Storage.
2. **Posts Pipeline:** Blog Post Text -> Embedding Model -> Post Vector.
3. **Matching & Safety Pipeline:** Cosine Similarity Scan -> Top Candidate -> Mismatch Guard (Tag Validation + Confidence Floor + Similarity Threshold) -> Accepted Match (Ranked & Explained) OR Safe Rejection (with Human-Readable Reason).

---

## 3. Data Contracts & Schemas

### 3.1 Vision Ingestion Schema (`src/schema/schema.js`)
All vision model outputs must strictly validate against this runtime Zod schema:
- `subject` (string): Primary entity in the image (e.g., "red fox").
- `category` (string): High-level class (e.g., "animal").
- `attributes` (array of strings, non-empty): Visual traits (e.g., ["orange fur", "forest", "snow"]).
- `caption` (string): Detailed visual description.
- `confidence` (number, 0.0 to 1.0): Classification certainty.

### 3.2 Database Models (SQLite)
- **`images` Table:**
  - `id` (TEXT, Primary Key): Unique image identifier.
  - `file_path` (TEXT): Local file path within `dataset/images/`.
  - `subject` (TEXT): Primary entity name.
  - `category` (TEXT): Broad classification category.
  - `attributes` (TEXT): Serialized JSON array of attributes.
  - `caption` (TEXT): Natural language description.
  - `confidence` (REAL): Model certainty score.
  - `embedding` (TEXT): Serialized float vector array of the caption.
  - `created_at` (DATETIME): Record creation timestamp.

- **`posts` Table:**
  - `id` (TEXT, Primary Key): Unique post identifier.
  - `title` (TEXT): Post title.
  - `content` (TEXT): Full article text.
  - `embedding` (TEXT): Serialized float vector array of post text.
  - `created_at` (DATETIME): Record creation timestamp.

---

## 4. Matching Strategy & The Mismatch Guard

### 4.1 Similarity Computation
Semantic similarity is calculated using the Cosine Similarity formula between the post embedding vector and all stored image caption vectors:
$$\text{Cosine Similarity}(A, B) = \frac{A \cdot B}{\Vert{}A\Vert{} \Vert{}B\Vert{}} = \frac{\sum_{i=1}^{n} A_i B_i}{\sqrt{\sum_{i=1}^{n} A_i^2} \sqrt{\sum_{i=1}^{n} B_i^2}}$$

### 4.2 The Mismatch Guard Rules
A candidate image is only accepted if it satisfies all three guard conditions:
1. **Rule 1 - Confidence Floor:** Candidate image must have `confidence >= 0.80`. Low-confidence vision classifications are rejected immediately.
2. **Rule 2 - Similarity Threshold:** Cosine similarity score must be `>= 0.72`. Below this cutoff, candidates are rejected as "insufficient semantic match".
3. **Rule 3 - Entity & Tag Integrity:** The post topic must not conflict with the candidate's `subject` or `category`. If the post requests a "fox" and the top candidate is classified as a "wolf", the guard rejects the match with an explicit reason: `"Entity mismatch: expected fox, detected wolf"`.
