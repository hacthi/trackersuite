import axios, { AxiosError } from 'axios';
import crypto from 'crypto';
import { storage } from '../storage';

export interface WebhookPayload {
  event: string;
  data: any;
  userId: number;
  timestamp?: string;
}

export interface WebhookDelivery {
  id: number;
  webhookId: number;
  event: string;
  payload: any;
  status: 'success' | 'failed' | 'pending';
  statusCode?: number;
  response?: string;
  error?: string;
  attempts: number;
  nextRetry?: Date;
  createdAt: Date;
}

export interface Webhook {
  id: number;
  userId: number;
  name: string;
  url: string;
  events: string[];
  secret?: string;
  active: boolean;
  headers?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

class WebhookService {
  private readonly maxRetries = 3;
  private readonly retryDelays = [30000, 300000, 1800000]; // 30s, 5m, 30m

  /**
   * Trigger webhooks for a specific event
   */
  async trigger(event: string, payload: WebhookPayload): Promise<void> {
    try {
      // Get all active webhooks that listen to this event
      const webhooks = await storage.getActiveWebhooksForEvent(event);
      
      if (webhooks.length === 0) {
        return;
      }

      // Send webhooks in parallel
      const promises = webhooks.map(webhook => 
        this.sendWebhook(webhook, payload)
      );

      await Promise.allSettled(promises);
    } catch (error) {
      console.error(`Error triggering webhooks for event ${event}:`, error);
    }
  }

  /**
   * Send a webhook to a specific endpoint
   */
  async sendWebhook(webhook: Webhook, payload: WebhookPayload): Promise<{
    success: boolean;
    status?: number;
    response?: string;
    error?: string;
  }> {
    try {
      if (!webhook.active) {
        return { success: false, error: 'Webhook is inactive' };
      }

      // Prepare the payload
      const webhookPayload = {
        event: payload.event,
        data: payload.data,
        timestamp: payload.timestamp || new Date().toISOString(),
        webhook_id: webhook.id
      };

      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'Tracker-Suite-Webhooks/1.0',
        ...webhook.headers
      };

      // Add signature if secret is provided
      if (webhook.secret) {
        const signature = this.generateSignature(
          JSON.stringify(webhookPayload),
          webhook.secret
        );
        headers['X-Tracker-Suite-Signature'] = signature;
      }

      // Send the webhook
      const response = await axios.post(webhook.url, webhookPayload, {
        headers,
        timeout: 30000, // 30 second timeout
        validateStatus: (status) => status >= 200 && status < 300
      });

      // Log successful delivery
      await storage.logWebhookDelivery({
        webhookId: webhook.id,
        event: payload.event,
        payload: webhookPayload,
        status: 'success',
        statusCode: response.status,
        response: JSON.stringify(response.data).substring(0, 1000),
        attempts: 1
      });

      return {
        success: true,
        status: response.status,
        response: JSON.stringify(response.data)
      };

    } catch (error) {
      let errorMessage = 'Unknown error';
      let statusCode: number | undefined;

      if (error instanceof AxiosError) {
        errorMessage = error.message;
        statusCode = error.response?.status;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      // Log failed delivery
      await storage.logWebhookDelivery({
        webhookId: webhook.id,
        event: payload.event,
        payload,
        status: 'failed',
        statusCode,
        error: errorMessage,
        attempts: 1
      });

      // Schedule retry if appropriate
      if (this.shouldRetry(statusCode)) {
        await this.scheduleRetry(webhook, payload, 1);
      }

      return {
        success: false,
        status: statusCode,
        error: errorMessage
      };
    }
  }

  /**
   * Generate HMAC signature for webhook payload
   */
  private generateSignature(payload: string, secret: string): string {
    return `sha256=${crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex')}`;
  }

  /**
   * Determine if a webhook should be retried based on status code
   */
  private shouldRetry(statusCode?: number): boolean {
    if (!statusCode) return true; // Retry on network errors
    
    // Don't retry on client errors (4xx), except for rate limiting (429)
    if (statusCode >= 400 && statusCode < 500) {
      return statusCode === 429;
    }
    
    // Retry on server errors (5xx)
    return statusCode >= 500;
  }

  /**
   * Schedule a webhook retry
   */
  private async scheduleRetry(
    webhook: Webhook,
    payload: WebhookPayload,
    attempt: number
  ): Promise<void> {
    if (attempt >= this.maxRetries) {
      console.log(`Max retries reached for webhook ${webhook.id}`);
      return;
    }

    const delay = this.retryDelays[attempt - 1] || this.retryDelays[this.retryDelays.length - 1];
    const nextRetry = new Date(Date.now() + delay);

    // Store retry information in database
    await storage.scheduleWebhookRetry({
      webhookId: webhook.id,
      event: payload.event,
      payload,
      attempt: attempt + 1,
      nextRetry
    });

    // Schedule the actual retry
    setTimeout(async () => {
      console.log(`Retrying webhook ${webhook.id}, attempt ${attempt + 1}`);
      
      try {
        const result = await this.sendWebhook(webhook, payload);
        
        if (!result.success && this.shouldRetry(result.status)) {
          await this.scheduleRetry(webhook, payload, attempt + 1);
        }
      } catch (error) {
        console.error(`Retry failed for webhook ${webhook.id}:`, error);
        
        if (attempt + 1 < this.maxRetries) {
          await this.scheduleRetry(webhook, payload, attempt + 1);
        }
      }
    }, delay);
  }

  /**
   * Process pending webhook retries (called by background job)
   */
  async processPendingRetries(): Promise<void> {
    try {
      const pendingRetries = await storage.getPendingWebhookRetries();
      
      for (const retry of pendingRetries) {
        const webhook = await storage.getWebhookById(retry.webhookId);
        
        if (webhook && webhook.active) {
          const result = await this.sendWebhook(webhook, {
            event: retry.event,
            data: retry.payload.data,
            userId: retry.payload.userId,
            timestamp: retry.payload.timestamp
          });

          if (!result.success && this.shouldRetry(result.status)) {
            if (retry.attempt < this.maxRetries) {
              await this.scheduleRetry(webhook, retry.payload, retry.attempt);
            }
          }
        }

        // Remove from pending retries
        await storage.removePendingRetry(retry.id);
      }
    } catch (error) {
      console.error('Error processing pending webhook retries:', error);
    }
  }

  /**
   * Validate webhook signature
   */
  validateSignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Test webhook connectivity
   */
  async testWebhook(webhook: Webhook): Promise<{
    success: boolean;
    latency?: number;
    error?: string;
  }> {
    const start = Date.now();
    
    try {
      const testPayload = {
        event: 'webhook.test',
        data: {
          message: 'This is a test webhook',
          timestamp: new Date().toISOString()
        },
        userId: webhook.userId,
        webhook_id: webhook.id
      };

      const result = await this.sendWebhook(webhook, {
        event: 'webhook.test',
        data: testPayload.data,
        userId: webhook.userId
      });

      const latency = Date.now() - start;

      return {
        success: result.success,
        latency,
        error: result.error
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const webhookService = new WebhookService();