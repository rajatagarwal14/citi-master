import { WhatsAppClient } from '../utils/whatsapp-client';
import { SessionService } from './session.service';
import { GrokAIService } from './grok-ai.service';
import { firebaseDb } from '../utils/firebase-db';
import { IncomingMessage, ConversationState } from '../types';
import { logger } from '../utils/logger';

export class ChatSupportService {
  private whatsapp = new WhatsAppClient();
  private sessionService = new SessionService();
  private grokAI = new GrokAIService();

  async handleChatSupport(message: IncomingMessage, state: ConversationState): Promise<boolean> {
    // Start chat support
    if (message.buttonReply?.id === 'chat_support' || message.text?.toLowerCase().includes('chat')) {
      state.step = 'CHAT';
      state.chatMessages = [];
      await this.sessionService.setState(message.from, state);
      
      await this.whatsapp.sendText(
        message.from,
        `💬 *Chat with Citi Master Support*\n\n👋 Hi! I'm your AI assistant powered by Grok. Ask me anything about:\n\n• Service pricing\n• Service areas\n• Booking process\n• Vendor registration\n• Any other questions\n\n💡 Type your question or reply:\n- "callback" to request human support\n- "book" to start booking a service`
      );
      return true;
    }

    // Handle ongoing chat
    if (state.step === 'CHAT') {
      const userMessage = message.text || '';

      // Check for callback request
      if (userMessage.toLowerCase().includes('callback') || 
          userMessage.toLowerCase().includes('call back') ||
          userMessage.toLowerCase().includes('human') ||
          userMessage.toLowerCase().includes('agent')) {
        state.step = 'CALLBACK_REQUEST';
        await this.sessionService.setState(message.from, state);
        
        await this.whatsapp.sendText(
          message.from,
          `📞 *Request Human Support*\n\nI understand you'd like to speak with our team.\n\nPlease share:\n1️⃣ Your name\n2️⃣ Email ID\n3️⃣ Brief description of your issue\n\n📝 Example:\nJohn Doe\njohn@email.com\nNeed help with AC service pricing`
        );
        return true;
      }

      // Check for booking request
      if (userMessage.toLowerCase().includes('book') || 
          userMessage.toLowerCase().includes('service')) {
        state.step = 'START';
        state.chatMessages = undefined;
        await this.sessionService.setState(message.from, state);
        return false; // Let main conversation handler take over
      }

      // Get AI response
      try {
        state.chatMessages = state.chatMessages || [];
        state.chatMessages.push({ role: 'user', content: userMessage });

        // Build context for Grok
        const context = `You are Citi Master's customer support AI assistant. Help users with:
- Service categories: AC Service, Cleaning, Plumbing, Electrical, Painting, Carpentry
- Pricing: AC ₹299+, Cleaning ₹399+, Plumbing ₹199+, Electrical ₹249+, Painting ₹149/sqft, Carpentry ₹399+
- Service areas: Delhi NCR, Jhansi
- Same-day service available
- 100% satisfaction guarantee
- Commission for vendors: 15%

Keep responses short (2-3 sentences). Be helpful and friendly.

User question: ${userMessage}`;

        const aiResponse = await this.grokAI.chat(context);
        
        state.chatMessages.push({ role: 'assistant', content: aiResponse });
        await this.sessionService.setState(message.from, state);

        // Log chat interaction
        await firebaseDb.logMessage({
          phoneNumber: message.from,
          direction: 'INBOUND',
          messageType: 'chat_support',
          content: { userMessage, aiResponse },
          waMessageId: message.messageId,
        });

        await this.whatsapp.sendText(
          message.from,
          `${aiResponse}\n\n━━━━━━━━━\n💡 Reply with:\n• Another question\n• "callback" for human support\n• "book" to start booking`
        );

        return true;
      } catch (error) {
        logger.error(error, 'Chat support error');
        await this.whatsapp.sendText(
          message.from,
          `❌ Sorry, I'm having trouble right now.\n\nType "callback" to request human support, or try again.`
        );
        return true;
      }
    }

    // Handle callback request details
    if (state.step === 'CALLBACK_REQUEST') {
      const callbackInfo = message.text || '';
      
      // Parse email from message
      const emailMatch = callbackInfo.match(/[\w.-]+@[\w.-]+\.\w+/);
      const email = emailMatch ? emailMatch[0] : '';

      // Create callback request in Firebase
      try {
        await firebaseDb.createCallbackRequest({
          phoneNumber: message.from,
          email: email,
          message: callbackInfo,
          chatHistory: state.chatMessages || [],
          status: 'PENDING',
          createdAt: new Date().toISOString(),
        });

        await this.whatsapp.sendText(
          message.from,
          `✅ *Callback Request Received!*\n\n📋 Our team will reach out to you within 2-4 hours.\n\n📞 Contact: ${message.from}${email ? `\n📧 Email: ${email}` : ''}\n\n�� Meanwhile, you can:\n• Continue chatting (just send a message)\n• Book a service (type "book")\n\nThank you for contacting Citi Master! 🙏`
        );

        // Reset to START
        state.step = 'START';
        state.chatMessages = undefined;
        state.callbackRequested = true;
        await this.sessionService.setState(message.from, state);

        return true;
      } catch (error) {
        logger.error(error, 'Error creating callback request');
        await this.whatsapp.sendText(
          message.from,
          `❌ Error saving your request. Please try again or call us at 1800-CITIMSTR`
        );
        return true;
      }
    }

    return false;
  }
}
