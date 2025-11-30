import { config } from '../config';
import { logger } from './logger';

export class WhatsAppClient {
  private readonly baseUrl: string;
  private readonly token: string;

  constructor() {
    this.baseUrl = `https://graph.facebook.com/${config.whatsapp.apiVersion}/${config.whatsapp.phoneNumberId}`;
    this.token = config.whatsapp.token;
  }

  async sendText(to: string, text: string): Promise<void> {
    await this.sendMessage(to, {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    });
  }

  async sendButtons(to: string, body: string, buttons: Array<{ id: string; title: string }>): Promise<void> {
    if (buttons.length > 3) {
      throw new Error('Maximum 3 buttons allowed');
    }

    await this.sendMessage(to, {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: body },
        action: {
          buttons: buttons.map(btn => ({
            type: 'reply',
            reply: { id: btn.id, title: btn.title.substring(0, 20) }
          }))
        }
      }
    });
  }

  async sendList(to: string, body: string, buttonText: string, sections: Array<{
    title: string;
    rows: Array<{ id: string; title: string; description?: string }>;
  }>): Promise<void> {
    await this.sendMessage(to, {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'list',
        body: { text: body },
        action: {
          button: buttonText,
          sections: sections.map(section => ({
            title: section.title,
            rows: section.rows.map(row => ({
              id: row.id,
              title: row.title.substring(0, 24),
              description: row.description?.substring(0, 72)
            }))
          }))
        }
      }
    });
  }

  private async sendMessage(to: string, payload: any): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`WhatsApp API error: ${error}`);
      }

      logger.debug({ to, type: payload.type }, 'Message sent');
    } catch (error) {
      logger.error(error, 'Failed to send WhatsApp message');
      throw error;
    }
  }
}
