# Image Relevance & Auto-Tagging
- This project is the capstone of **[Flyrank AI](https://internship.flyrank.ai/)**'s internship
- Capstone link : [Image Relevance & Auto-Tagging](https://internship.flyrank.ai/intern/assignments/CUSTOM-MQYC2OKX-00A4F545)

---

# Semantic Image Matcher & Mismatch Guard

A production-ready semantic matching and rejection engine built with Node.js and SQLite. The system indexes image libraries by understanding their visual content and connects them to blog posts based on semantic meaning rather than keywords.

The core design principle is **safe refusal over speculative matching**: when a post lacks a high-confidence match, the **Mismatch Guard** refuses to suggest an image and returns an explainable diagnostic payload.

---

## 1. System Architecture

```text
[ Raw Images ]
      │
      ▼
[ OpenRouter Vision API ] ──(Validation: Zod Schema)──► Subject, Category, Attributes, Caption
      │
      ▼
[ SQLite DB: images table ]
      │
      ▼
[ Xenova / Transformers.js ] ──(all-MiniLM-L6-v2)──► 384-dimensional Embeddings
      │
      ▼
═════════════════════════════ SERVING & GUARD LAYER ═════════════════════════════
      │
[ POST /api/suggest ] ──► [ Zod Validation ] ──► [ Generate Query Embedding ]
                                                          │
                                                          ▼
                                            [ Cosine Similarity vs DB ]
                                                          │
                                                          ▼
                                            ┌───────────────────────────┐
                                            │ Mismatch Guard Check      │
                                            │ Similarity >= 0.45        │
                                            └─────────────┬─────────────┘
                                                          │
                                     ┌────────────────────┴────────────────────┐
                                     ▼                                         ▼
                            [ >= 0.45: PASS ]                         [ < 0.45: REFUSE ]
                                     │                                         │
                             HTTP 200 Match                            HTTP 422 Refusal
                         (Image metadata + Score)                  (Mismatch Guard Warning)
                                     │
                                     ▼
═════════════════════════════ HUMAN REVIEW WORKFLOW ═════════════════════════════
                                     │
                        [ POST /api/review ]
                                     │
                       (Zod Input Verification)
                                     │
                                     ▼
                      [ SQLite DB: reviews table ]
                     (Recorded: approve / reject)
```

---

## 2. Database Schema
Managed via SQLite (better-sqlite3) across three tables:

```SQL
-- 1. Metadata and dense vector representations of processed assets
CREATE TABLE IF NOT EXISTS images (
    id TEXT PRIMARY KEY,
    file_path TEXT NOT NULL,
    subject TEXT NOT NULL, 
    category TEXT NOT NULL,
    attributes TEXT NOT NULL,
    caption TEXT NOT NULL,
    confidence REAL NOT NULL,
    embedding TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Blog post records with associated embeddings
CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Human-in-the-loop review audit trail
CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_text TEXT,
    image_id TEXT,
    cosineSimilarity REAL,
    status TEXT CHECK(status IN ('approve', 'reject')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 3. Installation & Setup
Prerequisites 
 - OpenRouter API key (free tier supported)

Setup Steps
1. Clone the repository and install dependencies:
```bash
    git clone https://github.com/Ali-Hegzy/Image_Relevance_And_Auto-Tagging_express.git
    cd Image_Relevance_And_Auto-Tagging_express
    npm install
```
2. Configure environment variables:
```bash
    cp .env.example .env
```
3. Add your OpenRouter key to `.env`:
```bash
    OPENROUTER_API_KEY=your_key_here
```

---

## 4. Pipeline & Management Scripts

Execute the pipeline stages sequentially:

| Command | Action | Description |
| :--- | :--- | :--- |
| `npm run batch` | Image Analysis | Dispatches raw images to OpenRouter, validates structure via Zod, and writes visual attributes to SQLite (`/src/scripts/batch-process.js`). |
| `npm run embedd` | Backfill Embeddings | Generates 384-dimensional dense vectors locally using Xenova's `all-MiniLM-L6-v2` and persists them (`/src/scripts/backfill-embedding.js`). |
| `npm run test-guard` | Threshold Calibration | Evaluates Min/Max/Avg cosine similarities across positive, paraphrased, and mismatch clusters to calibrate decision margins. |
| `npm run eval` | Precision Suite | Benchmarks the Mismatch Guard against `dataset/eval-set.js` to calculate top-1 decision precision. |
| `npm start` | Start API Server | Launches the Express HTTP server on the configured port. |

---

## 5. API Reference

All schemas are defined in `src/schema/schema.js`. Requests failing validation return `400 Bad Request` with detailed parsing errors.

### 1. Suggest Image (with Mismatch Guard)
Evaluates a query string and returns the highest-scoring asset only if it meets or exceeds the similarity threshold (`0.45`).

* **Endpoint:** `POST /api/suggest`
* **Headers:** `Content-Type: application/json`
* **Body:**
  ```json
  {
    "text": "Photo for a red fox"
  }
  ```

#### Responses

* **200 OK (Match Accepted):**
  ```json
  {
    "data": {
      "success": true,
      "standard_threshold": 0.45,
      "cosine_similarity": 0.772,
      "image": {
        "id": "6c9a038c-fbbf-4da8-901c-9430fd142b4c",
        "path": "dataset/images/fox-08.jpg"
      }
    }
  }
  ```

* **422 Unprocessable Entity (Refused by Mismatch Guard):**
  ```json
  {
    "data": {
      "success": false,
      "standard_threshold": 0.45,
      "cosine_similarity": 0.214,
      "message": "Mismatch Guard Warning: No image semantically matches the post!"
    }
  }
  ```

* **422 Unprocessable Entity (Library Empty):**
  ```json
  {
    "data": {
      "success": false,
      "threshold": 0.45,
      "message": "No images are embedded"
    }
  }
  ```

* **500 Internal Server Error:**
  ```json
  {
    "error": "Internal server error",
    "message": "Error details..."
  }
  ```

---

### 2. Human Review Submission
Records editor decisions (`approve` / `reject`) alongside the calculated cosine similarity for auditability.

* **Endpoint:** `POST /api/review`
* **Headers:** `Content-Type: application/json`
* **Body:**
  ```json
  {
    "post_text": "Photo for a red fox",
    "image_id": "0790f436-d434-4c15-a464-7e4bc6677992",
    "cosineSimilarity": 0.77,
    "status": "approve"
  }
  ```

#### Responses

* **200 OK:**
  ```json
  {
    "success": true,
    "message": "Suggestion marked as approve"
  }
  ```

* **400 Bad Request (Validation Failure):**
  Returned if required fields are missing, malformed, or if `status` is not `"approve"` or `"reject"`.

---

## 6. Mismatch Guard Verification

The threshold was calibrated using empirical boundary separation:

$$\text{Noise Ceiling} = \text{Max}(\text{Mismatch}) + 0.08 = 0.2712 + 0.08 = 0.3512$$
$$\text{Decision Margin} = \frac{\text{Noise Ceiling} + \text{Min}(\text{Positive})}{2} = \frac{0.3512 + 0.4618}{2} \approx 0.4065 \implies \text{Adopted } 0.4500$$

Running `npm run eval` across the evaluation set produces:

$$\text{Precision} = \frac{\text{TP}}{\text{TP} + \text{FP}} = \frac{10}{10 + 0} = 1.00 \quad (100\%)$$

Zero False Positives were observed, verifying that the system safely refuses out-of-distribution queries rather than guessing.