const { getAllImagesWithEmbeddings } = require('../db/queries');
const { generateEmbedding } = require('../services/embedding.service');
const { findTopMatches } = require('../services/similarity.js');

const THRESHOLD = 0.45;

async function testMatch(postContent) {
    const postVector = await generateEmbedding(postContent);

    const allImages = getAllImagesWithEmbeddings();

    const topMatches = findTopMatches(postVector, allImages, 3);

    const result = {
        topMatches,
        final : '',
    }

    if (topMatches.length === 0 || topMatches[0].similarity < THRESHOLD) {
        result.final = 'Mismatch Guard Warning: No image semantically matches the post!';
    } else {
        result.final = `Best matching image: ID ${topMatches[0].id}`;
    }

    return result;
}

// Positive Match
// const posts = [
//     "red fox",
//     "Gray wolf",
//     "Hyena",
//     "angry wolf",
//     "bloody hyena",
//     "cute deer",
//     "two deer",
//     "mother deer",
//     "rock",
//     "mother red fox",
// ];

// Paraphrased Match 
// const posts = [
//     "Vulpes vulpes",
//     "Canis lupus",
//     "Crocuta crocuta",
//     "Cervidae",
//     "mother Cervidae",
//     "alert Cervidae",
//     "angry canis lupus",
//     "Predator Canis lupus",
//     "a cute prey",
//     "hungry Crocuta crocuta",
// ];

// Mismatch
const posts = [
    "Quantum Physics",
    "neural networks",
    "Cheese",
    "Plane",
    "Sword",
    "Ship",
    "chip",
    "Countary",
    "Moon",
    "Light",
];

const analyzeGroup = async () => {
    const scores = [];
    for (const post of posts) {
        const data = await testMatch(post);
        scores.push(data.topMatches[0].similarity);
    }

    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

    console.log(`Scores:`, scores.map(s => s.toFixed(4)));
    console.log(`Min: ${min.toFixed(4)} | Max: ${max.toFixed(4)} | Avg: ${avg.toFixed(4)}\n`);
};

analyzeGroup();
