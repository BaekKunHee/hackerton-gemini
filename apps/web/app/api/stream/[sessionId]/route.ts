import { NextRequest } from 'next/server';
import { getSession, subscribeToSession } from '@/lib/session-store';
import type { StreamEvent } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  const session = getSession(sessionId);
  if (!session) {
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: 'SESSION_NOT_FOUND', message: 'Session not found' },
      }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      function send(event: StreamEvent) {
        try {
          const data = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(data));
        } catch {
          // Controller may be closed
        }
      }

      // Send initial connection event
      send({
        type: 'agent_status',
        payload: {
          agentId: 'analyzer',
          status: 'idle',
          message: '연결됨',
          progress: 0,
        },
      });

      // If session is already done, send result immediately
      if (session.status === 'done' && session.result) {
        send({
          type: 'analysis_complete',
          payload: { sessionId, result: session.result },
        });
        controller.close();
        return;
      }

      // Subscribe to session events
      const unsubscribe = subscribeToSession(sessionId, {
        onAgentStatus: (status) => {
          send({
            type: 'agent_status',
            payload: status,
          });
        },
        onPanelUpdate: (panel, data) => {
          send({
            type: 'panel_update',
            panel,
            payload: data,
          } as StreamEvent);
        },
        onComplete: (result) => {
          send({
            type: 'analysis_complete',
            payload: result,
          });
          // Close stream after complete
          setTimeout(() => {
            try {
              controller.close();
            } catch {
              // Already closed
            }
          }, 100);
        },
        onError: (error) => {
          send({
            type: 'error',
            payload: error,
          });
        },
      });

      // Cleanup on abort
      request.signal.addEventListener('abort', () => {
        unsubscribe();
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
