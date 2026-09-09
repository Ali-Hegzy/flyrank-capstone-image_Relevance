require('dotenv').config();
const { pipeline } = require('@xenova/transformers');
const {embeddingSchema} = require('../schema/schema');
const {withRetry} = require('./vision.service')

let embedder = null;

async function getEmbedder() {
    if (!embedder) {
        embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }
    return embedder;
}

async function output(extractor, data){
    const output = await extractor(data, {
        pooling: 'mean',
        normalize: true,
    });

    return Array.from(output.data);
}

/**
 * Converting any text into a numerical vector (vector embedding)
 * @param {string} text Text to be converted
 * @returns {Promise<number[]>} Float Array
 */
async function generateEmbedding(text) {
    let validation = embeddingSchema.safeParse({text});

    if(!validation.success){
        throw new Error('The text required to generate the embedding is invalid or empty.');
    }

    const extractor = await getEmbedder();


    return await withRetry(() => output(extractor, validation.data.text), 3, 6000);
}

module.exports = { generateEmbedding };