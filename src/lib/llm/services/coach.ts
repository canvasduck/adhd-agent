import { getOpenAIClient, LLM_MODEL } from '../client';
import { COACH_SYSTEM_PROMPT } from '../prompts';
import type { Message } from '@/types';

export async function* streamCoachResponse(
  userMessage: string,
  conversationHistory: Message[] = []
): AsyncGenerator<string> {
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: COACH_SYSTEM_PROMPT },
  ];

  // Add conversation history
  for (const msg of conversationHistory) {
    messages.push({
      role: msg.role,
      content: msg.content,
    });
  }

  // Add current user message
  messages.push({ role: 'user', content: userMessage });

  const stream = await getOpenAIClient().chat.completions.create({
    model: LLM_MODEL,
    messages,
    stream: true,
    max_tokens: 500,
    temperature: 0.7,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      yield content;
    }
  }
}

export async function getCoachResponse(
  userMessage: string,
  conversationHistory: Message[] = []
): Promise<string> {
  let fullResponse = '';
  for await (const chunk of streamCoachResponse(userMessage, conversationHistory)) {
    fullResponse += chunk;
  }
  return fullResponse;
}
