import { createOpenAI } from '@ai-sdk/openai';

function getChatModel() {
  const apiUrl = process.env.LLM_API_URL;
  const modelName = process.env.LLM_MODEL;

  if (!apiUrl) {
    throw new Error('LLM_API_URL is not configured.');
  }

  if (!modelName) {
    throw new Error('LLM_MODEL is not configured.');
  }

  const provider = createOpenAI({
    apiKey: process.env.LLM_API_KEY ?? 'harp-local',
    baseURL: apiUrl,
    name: 'harp-qwen',
  });

  return provider(modelName);
}

export { getChatModel };
