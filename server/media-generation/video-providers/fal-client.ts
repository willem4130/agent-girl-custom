/**
 * FAL.ai Client
 *
 * Base client for FAL.ai video generation API.
 * https://fal.ai/models
 */

const FAL_API_BASE = 'https://fal.run/fal-ai';

interface FalSubmitResponse {
  request_id: string;
}

interface FalStatusResponse {
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  logs?: Array<{ message: string; timestamp: string }>;
}

interface FalResultResponse {
  video?: {
    url: string;
    content_type?: string;
    file_size?: number;
  };
  images?: Array<{ url: string }>;
  seed?: number;
  timings?: Record<string, number>;
  error?: string;
}

export class FalClient {
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.FAL_API_KEY;
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  /**
   * Submit a generation request
   */
  async submit(
    modelId: string,
    input: Record<string, unknown>
  ): Promise<{ requestId: string } | { error: string }> {
    if (!this.apiKey) {
      return { error: 'FAL_API_KEY not configured' };
    }

    try {
      const response = await fetch(`${FAL_API_BASE}/${modelId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Key ${this.apiKey}`,
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const text = await response.text();
        return { error: `FAL API error: ${response.status} - ${text}` };
      }

      // Check if it's a synchronous response (immediate result)
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const data = await response.json() as FalSubmitResponse | FalResultResponse;

        // If it has request_id, it's an async job
        if ('request_id' in data) {
          return { requestId: data.request_id };
        }

        // Otherwise it might be a direct result (for fast models)
        // This shouldn't happen for video models, but handle it
        return { error: 'Unexpected synchronous response' };
      }

      return { error: 'Unexpected response format' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { error: message };
    }
  }

  /**
   * Check the status of a generation request
   */
  async getStatus(modelId: string, requestId: string): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress?: number;
    logs?: string[];
  }> {
    if (!this.apiKey) {
      return { status: 'failed' };
    }

    try {
      const response = await fetch(`${FAL_API_BASE}/${modelId}/requests/${requestId}/status`, {
        headers: {
          'Authorization': `Key ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        return { status: 'failed' };
      }

      const data = await response.json() as FalStatusResponse;

      const statusMap: Record<string, 'pending' | 'processing' | 'completed' | 'failed'> = {
        'IN_QUEUE': 'pending',
        'IN_PROGRESS': 'processing',
        'COMPLETED': 'completed',
        'FAILED': 'failed',
      };

      return {
        status: statusMap[data.status] || 'processing',
        logs: data.logs?.map(l => l.message),
      };
    } catch {
      return { status: 'failed' };
    }
  }

  /**
   * Get the result of a completed generation
   */
  async getResult(modelId: string, requestId: string): Promise<FalResultResponse> {
    if (!this.apiKey) {
      return { error: 'FAL_API_KEY not configured' };
    }

    try {
      const response = await fetch(`${FAL_API_BASE}/${modelId}/requests/${requestId}`, {
        headers: {
          'Authorization': `Key ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        return { error: `Failed to get result: ${response.status} - ${text}` };
      }

      return await response.json() as FalResultResponse;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { error: message };
    }
  }

  /**
   * Poll for completion and return the result
   */
  async waitForCompletion(
    modelId: string,
    requestId: string,
    maxAttempts = 180, // 15 minutes at 5s intervals
    intervalMs = 5000,
    onProgress?: (status: 'pending' | 'processing', logs?: string[]) => void
  ): Promise<FalResultResponse> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const status = await this.getStatus(modelId, requestId);

      if (status.status === 'completed') {
        return this.getResult(modelId, requestId);
      }

      if (status.status === 'failed') {
        return { error: 'Generation failed' };
      }

      // Report progress
      if (onProgress) {
        onProgress(status.status, status.logs);
      }

      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }

    return { error: 'Generation timed out' };
  }
}

// Singleton instance
export const falClient = new FalClient();
