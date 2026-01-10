import { getOpenAIClient, LLM_MODEL } from '../client';
import { TASK_BREAKDOWN_PROMPT } from '../prompts';

export interface Subtask {
  title: string;
}

export async function breakdownTask(taskTitle: string): Promise<Subtask[]> {
  const response = await getOpenAIClient().chat.completions.create({
    model: LLM_MODEL,
    messages: [
      { role: 'system', content: TASK_BREAKDOWN_PROMPT },
      { role: 'user', content: `Break down this task: "${taskTitle}"` },
    ],
    max_tokens: 500,
    temperature: 0.3,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from LLM');
  }

  // Extract JSON from response
  const jsonMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/) || [null, content];
  const jsonStr = jsonMatch[1]?.trim() || content.trim();

  try {
    const result = JSON.parse(jsonStr) as { subtasks: Subtask[] };
    return result.subtasks;
  } catch {
    console.error('Failed to parse task breakdown response:', content);
    throw new Error('Failed to parse task breakdown response');
  }
}
