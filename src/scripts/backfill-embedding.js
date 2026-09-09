require('dotenv').config();
const { getImagesWithoutEmbeddings, updateImageEmbedding } = require('../db/queries');
const { generateEmbedding } = require('../services/embedding.service');
const { sleep } = require('../services/vision.service');

async function runBackfill() {
    console.log('--- Starting the image embeddings update process ---');

    const pendingImages = getImagesWithoutEmbeddings();
    console.log(`Number of remaining images requiring embedding: ${pendingImages.length}`);

    if (pendingImages.length === 0) {
        console.log('All images already have embeddings!');
        return;
    }

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < pendingImages.length; i++) {
        const image = pendingImages[i];
        console.log(`[${i + 1}/${pendingImages.length}] Processing image ID: ${image.id} (${image.subject})`);

        const textToEmbed = `Subject: ${image.subject}. Category: ${image.category}. Description: ${image.caption}.`;

        try {
        const vector = await generateEmbedding(textToEmbed);
        updateImageEmbedding(image.id, vector);

        successCount++;
        console.log(`-> Saved successfully (vector length: ${vector.length})`);

        await sleep(4000);
        } catch (error) {
            failCount++;
            console.error(`-> Failed to generate vector for image ${image.id}: ${error.message}`);
        }
    }

    console.log('\n==========================================');
    console.log('Backfill Embeddings report:');
    console.log(`- Success: ${successCount}`);
    console.log(`- Failed: ${failCount}`);
    console.log('==========================================\n');
}

runBackfill();