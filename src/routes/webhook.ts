import { Router, Request, Response } from 'express';
import { config } from '../config';
import { logger } from '../utils/logger';
import { WhatsAppParser } from '../utils/whatsapp-parser';
import { ConversationService } from '../services/conversation.service';

export const webhookRouter = Router();

const conversationService = new ConversationService();

// Webhook verification (GET)
webhookRouter.get('/', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === config.whatsapp.verifyToken) {
    logger.info('✅ Webhook verified');
    res.status(200).send(challenge);
  } else {
    logger.warn('❌ Webhook verification failed');
    res.sendStatus(403);
  }
});

// Webhook messages (POST)
webhookRouter.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body;

    // Quick 200 response (required by WhatsApp)
    res.sendStatus(200);

    // Process webhook asynchronously
    if (body.object !== 'whatsapp_business_account') {
      logger.debug('Ignoring non-WhatsApp webhook');
      return;
    }

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field !== 'messages') continue;

        const value = change.value;

        // Process messages
        if (value.messages && value.messages.length > 0) {
          for (const message of value.messages) {
            const parsed = WhatsAppParser.parseIncomingMessage(message);
            logger.info({ phoneNumber: parsed.from }, 'Incoming message');

            try {
              await conversationService.handleMessage(parsed);
            } catch (error) {
              logger.error(error, 'Error handling message');
            }
          }
        }

        // Process statuses (delivery, read receipts)
        if (value.statuses && value.statuses.length > 0) {
          for (const status of value.statuses) {
            logger.debug({ status }, 'Message status update');
          }
        }
      }
    }
  } catch (error) {
    logger.error(error, 'Webhook processing error');
  }
});
