import { getOpenAIClient, VISION_MODEL } from '../client';
import { IMAGE_ANALYSIS_PROMPT } from '../prompts';
import type { ImageAnalysisResult } from '@/types';

export async function analyzeImage(
  base64Image: string,
  mimeType: string,
  additionalContext?: string
): Promise<ImageAnalysisResult> {
  const userContent: Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }> = [];

  if (additionalContext) {
    userContent.push({
      type: 'text',
      text: `Additional context from user: ${additionalContext}`,
    });
  }

  userContent.push({
    type: 'text',
    text: 'Please analyze this image and create a task list to clean/organize the space.',
  });

  userContent.push({
    type: 'image_url',
    image_url: {
      url: `data:${mimeType};base64,${base64Image}`,
    },
  });

  const response = await getOpenAIClient().chat.completions.create({
    model: VISION_MODEL,
    messages: [
      { role: 'system', content: IMAGE_ANALYSIS_PROMPT },
      { role: 'user', content: userContent },
    ],
    max_tokens: 1000,
    temperature: 0.3,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from vision model');
  }

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/) || [null, content];
  const jsonStr = jsonMatch[1]?.trim() || content.trim();

  try {
    const result = JSON.parse(jsonStr) as ImageAnalysisResult;
    return result;
  } catch {
    console.error('Failed to parse image analysis response:', content);
    throw new Error('Failed to parse image analysis response');
  }
}

export async function analyzeImageWithAnswer(
  base64Image: string,
  mimeType: string,
  question: string,
  answer: string
): Promise<ImageAnalysisResult> {
  const context = `Previously asked: "${question}" - User answered: "${answer}"`;
  return analyzeImage(base64Image, mimeType, context);
}
