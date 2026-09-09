# AI processing
- [x] Vision model produces structured output validated against a schema; invalid responses are never trusted.
- [x] Low-confidence classifications are flagged instead of accepted.
- [x] Images are processed through a batch background job with retries.
- [x] Vision and embedding costs are tracked per call.

# Matching system
- [x] Image and post embeddings are stored; posts return ranked image suggestions.
- [x] Semantic matching works for equivalent concepts — "red fox" matches "Vulpes vulpes".

# Saftey Layer
- [x] The mismatch guard rejects incorrect recommendations — the wolf-on-a-fox-post scenario provably fails.
- [x] Rejections include a human-readable explanation.
- [x] When no image clears the bar, the system answers "no confident match" with reasons.

# Backend
- [ ] Database models for images, tags, embeddings, posts, suggestions, approvals/rejections — with the required indexes. 
 > I have just made two tables [`images`, `posts`]
- [x] API endpoints validated; the review workflow (approve / reject / inspect why) exists.

# Quality & documentation
- [x] A small labeled evaluation dataset measures top-1 precision.
 > Precision = 1.0 [100%]