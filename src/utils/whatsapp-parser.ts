import { IncomingMessage } from '../types';

export class WhatsAppParser {
  static parseIncomingMessage(message: any): IncomingMessage {
    const parsed: IncomingMessage = {
      from: message.from,
      messageId: message.id,
      timestamp: parseInt(message.timestamp),
      type: message.type as any,
    };

    switch (message.type) {
      case 'text':
        parsed.text = message.text?.body;
        break;
      case 'interactive':
        if (message.interactive?.type === 'button_reply') {
          parsed.type = 'button';
          parsed.buttonReply = {
            id: message.interactive.button_reply.id,
            title: message.interactive.button_reply.title,
          };
        } else if (message.interactive?.type === 'list_reply') {
          parsed.type = 'interactive';
          parsed.listReply = {
            id: message.interactive.list_reply.id,
            title: message.interactive.list_reply.title,
            description: message.interactive.list_reply.description,
          };
        }
        break;
    }

    return parsed;
  }
}
