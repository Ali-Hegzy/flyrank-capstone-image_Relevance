require('dotenv').config();
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
const { visionModel } = require('../schema/schema');

const client = new OpenAI({
  baseURL: process.env.LLM_BASE_URL,
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'http://localhost:3000',
    'X-Title': 'Mismatch Guard Capstone',
  },
});

// Per Million Token
const PRICING = {
  inputPerMillion: 0.10,   // $0.10
  outputPerMillion: 0.40,  // $0.40
};

function calculateCost(inputTokens, outputTokens) {
  // Pricing Based on Gemini Flash refrence pricing
  const inputCost = (inputTokens / 1_000_000) * PRICING.inputPerMillion;
  const outputCost = (outputTokens / 1_000_000) * PRICING.outputPerMillion;
  const totalCost = inputCost + outputCost;

  return {inputCost, outputCost, totalCost};
}

function encodeImageToBase64(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const base64Data = fileBuffer.toString('base64');
  
  const ext = path.extname(filePath).toLowerCase();
  const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
  
  return `data:${mimeType};base64,${base64Data}`;
}

const Prompt = fs.readFileSync(
  path.join(__dirname, `../../prompts/v1.md`),'utf-8'
);

async function analyzeImage(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not Found ${filePath}`);
  }

	// Imagae converting
  const imageUrl = encodeImageToBase64(filePath);

  const response = await client.chat.completions.create({
    model: process.env.LLM_MODEL,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'user',
        content: [
          { 
            type: 'text', 
            text: Prompt 
          },
          {
            type: 'image_url',
            image_url: {
              url: imageUrl,
            },
          },
        ],
      },
    ],
  });

  const rawContent = response.choices[0].message.content;

	let parsedDate;
	try{
		parsedDate = JSON.parse(rawContent);
	}catch(error){
		throw new Error(`Failed to conver to JSON fromat: ${parsedDate}`);
	}

	let validation = visionModel.safeParse(parsedDate);
  if (!validation.success) {
    const formatedError = JSON.stringify(validation.error.format());

		throw new Error(`Schema Validation Error : ${formatedError}`);
  }

	// Consumption Calculation
  const usage = response.usage || {};
  const inputTokens = usage.prompt_tokens || 0;
  const outputTokens = usage.completion_tokens || 0;

  const cost = calculateCost(inputTokens, outputTokens);

	return {
		data : validation.data,
		Consumption : {
			inputTokens,
			outputTokens,
			totalTokens : inputTokens + outputTokens,
			costUSD : cost.totalCost,
		},
	};
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Any function that is not synchronous will be executed with automatic retry and exponential rollback.
 * @param {Function} fn The function to execute
 * @param {number} maxRetries max num of retries
 * @param {number} baseDelayMs start time with ms
 */
async function withRetry(fn, maxRetries = 3, baseDelayMs = 1000) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {

			return await fn();
    } catch (error) {
      lastError = error;
      console.warn(`[attemps ${attempt}/${maxRetries} failed]: ${error.message}`);

      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        console.log(`⏳ watiting for ${delay / 1000} seconds before retrying`);
        await sleep(delay);
      }
    }
  }

  throw new Error(`All attempts faild (${maxRetries}): ${lastError.message}`);
}

module.exports = { analyzeImage, withRetry, sleep };