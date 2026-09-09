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

module.exports = {visionModel, embeddingSchema};