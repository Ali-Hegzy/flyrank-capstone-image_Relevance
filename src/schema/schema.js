const {z} = require('zod');

const visionModel = z.object({
    subject : z.string(),
    category : z.string(),
    attributes : z.array(z.string()).nonempty(),
    caption : z.string(),
    confidence : z.number().min(0).max(1),
});

const embeddingSchema = z.object({
    text : z.string().trim().nonempty(),
});

const reviewSchema = z.object({
    post_text : z.string(),
    image_id : z.uuid(),
    cosineSimilarity : z.number().min(0).max(1),
    status : z.enum(['approve', 'reject']),
})

module.exports = {visionModel, embeddingSchema, reviewSchema};