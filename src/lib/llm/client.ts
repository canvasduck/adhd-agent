import OpenAI from 'openai';

let _openai: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000',
        'X-Title': 'ADHD App',
      },
    });
  }
  return _openai;
}

export const LLM_MODEL = process.env.LLM_MODEL || 'anthropic/claude-sonnet-4';
export const VISION_MODEL = process.env.VISION_MODEL || 'anthropic/claude-sonnet-4';
