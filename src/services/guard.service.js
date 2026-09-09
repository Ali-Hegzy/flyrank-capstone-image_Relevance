const { getAllImagesWithEmbeddings } = require('../db/queries');
const { generateEmbedding } = require('../services/embedding.service');
const { findTopMatches } = require('../services/similarity.js');

const THRESHOLD = 0.45;

async function suggestImage(text) {
    const postVector = await generateEmbedding(text);
    const result = {
        data : null,
    }
    const allImages = getAllImagesWithEmbeddings();

    if(!allImages || allImages.length === 0){
        result.data = {
            success : false,
            threshold : THRESHOLD,
            message : 'No images are embedded',
        }

        return result;
    }

    const topMatches = findTopMatches(postVector, allImages, 1);


    if (topMatches.length === 0 || (topMatches[0]?.similarity ?? 0) < THRESHOLD) {
        result.data = {
            success : false,
            standard_threshold : THRESHOLD,
            cosine_similarity : topMatches[0].similarity,
            message : 'Mismatch Guard Warning: No image semantically matches the post!',
        };
    } else {
        result.data = {
            success : true,
            standard_threshold : THRESHOLD,
            cosine_similarity : topMatches[0].similarity,
            image : {
                id : topMatches[0].id,
                path : topMatches[0].filePath,
            }
        };
    }

    return result;
}

module.exports = { suggestImage }