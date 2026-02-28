import { NextRequest } from 'next/server';
import { backendUrl } from '@/lib/api/backend';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  const backendRes = await fetch(backendUrl(`/api/stream/${sessionId}`), {
    headers: { Accept: 'text/event-stream' },
  });

  if (!backendRes.ok || !backendRes.body) {
    return new Response(
      JSON.stringify({ success: false, error: { code: 'BACKEND_ERROR', message: 'Failed to connect to backend stream' } }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(backendRes.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
