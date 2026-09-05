require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const { analyzeImage, withRetry, sleep } = require('../services/vision.service');
const { isImageProcessed, insertImage } = require('../db/queries');

const IMAGES_DIR = path.join(__dirname, '../../dataset/images');

async function runBatchJob() {
  console.log('Start Batch Processing Job...');

  if (!fs.existsSync(IMAGES_DIR)) {
    console.error(`Dir not Found: ${IMAGES_DIR}`);
    return;
  }

  // filter the files
  const allFiles = fs.readdirSync(IMAGES_DIR);
  const imageFiles = allFiles.filter((file) => {
    const ext = path.extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png'].includes(ext);
  });

  let processedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  let totalTokens = 0;
  let totalCostUSD = 0;

  const startTime = Date.now();

  for (let i = 0; i < imageFiles.length; i++) {
    const fileName = imageFiles[i];
    const fullPath = path.join(IMAGES_DIR, fileName);
    const relativePath = `dataset/images/${fileName}`;

    console.log(`--------------------------------------------------`);
    console.log(`[${i + 1}/${imageFiles.length}] Checking image: ${fileName}`);

    if (isImageProcessed(relativePath)) {
      console.log(`Skip The image [Processed]`);
      skippedCount++;
      continue;
    }

    try {
      const result = await withRetry(() => analyzeImage(fullPath), 3, 2000);
      const { data, Consumption } = result;

      insertImage({
        id: randomUUID(),
        file_path: relativePath,
        subject: data.subject,
        category: data.category,
        attributes: JSON.stringify(data.attributes),
        caption: data.caption,
        confidence: data.confidence,
        embedding: JSON.stringify([]), // temp
      });

      // stats
      processedCount++;
      totalTokens += Consumption.totalTokens;
      totalCostUSD += Consumption.costUSD;

      console.log(`Processed successfully [${data.category}] ${data.subject}`);
      console.log(`Tokens: ${Consumption.totalTokens} | Cost: ~$${Consumption.costUSD.toFixed(6)}`);

      await sleep(1500);

    } catch (error) {
      failedCount++;
      console.error(`Image processing failed completely: ${fileName}`);
      console.error(`the reason: ${error.message}`);
    }
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`\n==================================================`);
  console.log(`Final Gate 2 Report(Batch Processing & Costs)`);
  console.log(`==================================================`);
  console.log(`- Total images in the folder: ${imageFiles.length}`);
  console.log(`- Successfully completed and stored:      ${processedCount}`);
  console.log(`- Skipped (processed):       ${skippedCount}`);
  console.log(`- Failure after attempts:      ${failedCount}`);
  console.log(`- Time taken:        ${durationSec}s`);
  console.log(`- Total Tokens:      ${totalTokens}`);
  console.log(`- Estimated cost:      $${totalCostUSD.toFixed(6)}`);
  console.log(`- Actual Invoiced Cost: $0.00 (OpenRouter Free Tier)`);
  console.log(`==================================================\n`);
}

runBatchJob();