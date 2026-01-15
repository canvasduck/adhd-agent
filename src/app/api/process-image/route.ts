import { analyzeImage } from '@/lib/llm/services/image-processor';

// This endpoint analyzes images and returns suggested tasks
// It doesn't write to the database, so it's allowed for unauthenticated users
export async function POST(request: Request) {
  try {
    const { image, mimeType, context } = await request.json() as {
      image: string;
      mimeType: string;
      context?: string;
    };

    if (!image || !mimeType) {
      return new Response('Image and mimeType are required', { status: 400 });
    }

    const result = await analyzeImage(image, mimeType, context);

    return Response.json(result);
  } catch (error) {
    console.error('Process image API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}
