import { streamCoachResponse } from '@/lib/llm/services/coach';
import type { Message } from '@/types';

export async function POST(request: Request) {
  try {
    const { message, history } = await request.json() as {
      message: string;
      history: Message[];
    };

    if (!message) {
      return new Response('Message is required', { status: 400 });
    }

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamCoachResponse(message, history)) {
            controller.enqueue(new TextEncoder().encode(chunk));
          }
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
