/**
 * Calculate the cosine similarity between two vectors
 * @param {number[]} vecA 
 * @param {number[]} vecB 
 * @returns {number} similarity degree between 0 and 1
 */
function cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) {
        throw new Error('Vectors must have the same dimension');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Comparing the query vector against all images and ranking them in descending order of similarity.
 * @param {number[]} queryVector Vector of the text to be searched for
 * @param {Array<{id: number, file_path: string, subject: string, caption: string, embedding: string}>} imagesList
 * @param {number} topK Number of results to return
 */
function findTopMatches(queryVector, imagesList, topK = 5) {
    const scored = [];

    for (const img of imagesList) {
        let imgVector;
        try {
            imgVector = typeof img.embedding === 'string' ? JSON.parse(img.embedding) : img.embedding;
        } catch {
            continue;
        }

        if (!Array.isArray(imgVector) || imgVector.length === 0) continue;

        const score = cosineSimilarity(queryVector, imgVector);

        scored.push({
            id: img.id,
            filePath: img.file_path,
            subject: img.subject,
            caption: img.caption,
            similarity: Number(score.toFixed(4)),
        });
    }

    scored.sort((a, b) => b.similarity - a.similarity);

    return scored.slice(0, topK);
}

module.exports = {
    cosineSimilarity,
    findTopMatches,
};