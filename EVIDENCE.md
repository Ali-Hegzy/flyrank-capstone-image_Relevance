# AI processing
- [ ] Vision model produces structured output validated against a schema; invalid responses are never trusted.
- [ ] Low-confidence classifications are flagged instead of accepted.
- [ ] Images are processed through a batch background job with retries.
- [ ] Vision and embedding costs are tracked per call.

# Matching system
- [ ] Image and post embeddings are stored; posts return ranked image suggestions.
- [ ] Semantic matching works for equivalent concepts — "red fox" matches "Vulpes vulpes".

# Saftey Layer
- [ ] The mismatch guard rejects incorrect recommendations — the wolf-on-a-fox-post scenario provably fails.
- [ ] Rejections include a human-readable explanation.
- [ ] When no image clears the bar, the system answers "no confident match" with reasons.

# Backend
- [ ] Database models for images, tags, embeddings, posts, suggestions, approvals/rejections — with the required indexes.
- [ ] API endpoints validated; the review workflow (approve / reject / inspect why) exists.

# Quality & documentation
- [ ] A small labeled evaluation dataset measures top-1 precision.