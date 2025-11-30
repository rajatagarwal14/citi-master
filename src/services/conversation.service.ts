import { IncomingMessage, ConversationState, CATEGORIES, SUBCATEGORIES } from '../types';
import { SessionService } from './session.service';
import { WhatsAppClient } from '../utils/whatsapp-client';
import { prisma } from '../utils/db';
import { logger } from '../utils/logger';
import { MatchingService } from './matching.service';
import { GrokAIService } from './grok-ai.service';
import { OnboardingService } from './onboarding.service';

export class ConversationService {
  private sessionService = new SessionService();
  private whatsapp = new WhatsAppClient();
  private matchingService = new MatchingService();
  private grokAI = new GrokAIService();
  private onboarding = new OnboardingService();

  async handleMessage(message: IncomingMessage): Promise<void> {
    const state = await this.sessionService.getState(message.from);
    const customer = await this.getOrCreateCustomer(message.from);

    // Check if first-time user with greeting
    if (message.text && state.step === 'START' && !customer.name) {
      const greetings = ['hi', 'hello', 'hey', 'start', 'book', 'partner', 'help'];
      const isGreeting = greetings.some(g => message.text!.toLowerCase().includes(g));
      
      if (isGreeting) {
        await this.onboarding.handleFirstContact(message.from, message.text);
        return;
      }
    }

    // Auto-detect language using Grok AI
    if (message.text && !state.language) {
      state.language = await this.grokAI.detectLanguage(message.text);
      await this.sessionService.setState(message.from, state);
    }

    // Log message
    await prisma.messageLog.create({
      data: {
        phoneNumber: message.from,
        direction: 'INBOUND',
        messageType: message.type,
        content: message,
        waMessageId: message.messageId,
        customerId: customer.id,
      }
    });

    // Handle based on current state
    switch (state.step) {
      case 'START':
        await this.handleStart(message, state);
        break;
      case 'CATEGORY':
        await this.handleCategory(message, state);
        break;
      case 'SUBCATEGORY':
        await this.handleSubcategory(message, state);
        break;
      case 'ADDRESS':
        await this.handleAddress(message, state, customer);
        break;
      case 'SLOT':
        await this.handleSlot(message, state);
        break;
      case 'CONFIRM':
        await this.handleConfirm(message, state, customer);
        break;
      default:
        await this.handleStart(message, state);
    }
  }

  private async handleStart(message: IncomingMessage, state: ConversationState): Promise<void> {
    // Use Grok AI to understand free-form requests
    if (message.text) {
      const intent = await this.grokAI.parseIntent(message.text);
      
      if (intent.intent === 'SERVICE_REQUEST' && intent.category && intent.confidence > 0.7) {
        // Skip category selection if AI detected it
        state.category = intent.category;
        state.subcategory = intent.subcategory;
        state.step = intent.subcategory ? 'ADDRESS' : 'SUBCATEGORY';
        await this.sessionService.setState(message.from, state);
        
        if (intent.subcategory) {
          const text = state.language === 'hi'
            ? '📍 अपना पता भेजें\n\nExample: Karol Bagh, Delhi 110005'
            : '📍 Send your address\n\nExample: Karol Bagh, Delhi 110005';
          await this.whatsapp.sendText(message.from, text);
        } else {
          await this.handleCategory(message, state);
        }
        return;
      }
    }

    const greeting = state.language === 'hi' 
      ? '🙏 नमस्ते! मैं Citi Master हूं।\n\nकौनसी सर्विस चाहिए?'
      : '👋 Hi! I\'m Citi Master.\n\nWhat service do you need?';

    await this.whatsapp.sendButtons(
      message.from,
      greeting,
      [
        { id: 'cat_AC', title: 'AC Service' },
        { id: 'cat_CLEANING', title: 'Cleaning' },
        { id: 'cat_PLUMBING', title: 'Plumbing' }
      ]
    );

    state.step = 'CATEGORY';
    await this.sessionService.setState(message.from, state);
  }

  private async handleCategory(message: IncomingMessage, state: ConversationState): Promise<void> {
    const categoryId = message.buttonReply?.id?.replace('cat_', '') || 
                       message.text?.toUpperCase();

    if (!categoryId || !(categoryId in CATEGORIES)) {
      await this.whatsapp.sendText(message.from, 'Please select a category');
      return;
    }

    state.category = categoryId;
    state.step = 'SUBCATEGORY';
    await this.sessionService.setState(message.from, state);

    const text = state.language === 'hi' ? 'कौनसा काम?' : 'What work?';
    
    await this.whatsapp.sendButtons(
      message.from,
      text,
      [
        { id: 'sub_REPAIR', title: 'Repair' },
        { id: 'sub_INSTALL', title: 'Installation' },
        { id: 'sub_SERVICE', title: 'Service' }
      ]
    );
  }

  private async handleSubcategory(message: IncomingMessage, state: ConversationState): Promise<void> {
    state.subcategory = message.buttonReply?.id?.replace('sub_', '') || message.text;
    state.step = 'ADDRESS';
    await this.sessionService.setState(message.from, state);

    const text = state.language === 'hi'
      ? '📍 अपना पता भेजें\n\nExample: Karol Bagh, Delhi 110005'
      : '📍 Send your address\n\nExample: Karol Bagh, Delhi 110005';

    await this.whatsapp.sendText(message.from, text);
  }

  private async handleAddress(message: IncomingMessage, state: ConversationState, customer: any): Promise<void> {
    const addressText = message.text;
    if (!addressText) return;

    // Use Grok AI to parse address
    const parsedAddress = await this.grokAI.parseAddress(addressText);

    state.address = {
      street: parsedAddress.street || addressText,
      area: parsedAddress.area,
      city: parsedAddress.city || 'Delhi',
      pincode: parsedAddress.pincode || '110001',
      landmark: parsedAddress.landmark,
      coordinates: { lat: 28.6139, lng: 77.2090 } // TODO: Use geocoding API
    };

    // Create lead
    const lead = await prisma.lead.create({
      data: {
        customerId: customer.id,
        category: state.category!,
        subcategory: state.subcategory!,
        address: state.address,
        status: 'PENDING'
      }
    });

    state.leadId = lead.id;

    // Find matching vendors
    const matches = await this.matchingService.findMatches(lead);

    if (matches.length === 0) {
      await this.whatsapp.sendText(
        message.from,
        state.language === 'hi' 
          ? '😔 अभी कोई vendor नहीं मिला। हम जल्दी contact करेंगे।'
          : '😔 No vendors available now. We\'ll contact you soon.'
      );
      return;
    }

    const text = state.language === 'hi'
      ? `✅ ${matches.length} vendors मिले!\n\nकब चाहिए?`
      : `✅ Found ${matches.length} vendors!\n\nWhen do you need?`;

    await this.whatsapp.sendButtons(
      message.from,
      text,
      [
        { id: 'slot_today', title: 'Today' },
        { id: 'slot_tomorrow', title: 'Tomorrow' },
        { id: 'slot_later', title: 'Later' }
      ]
    );

    state.step = 'SLOT';
    await this.sessionService.setState(message.from, state);
  }

  private async handleSlot(message: IncomingMessage, state: ConversationState): Promise<void> {
    state.slot = message.buttonReply?.id || message.text;
    state.step = 'CONFIRM';
    await this.sessionService.setState(message.from, state);

    const summary = state.language === 'hi'
      ? `📋 Booking:\n\n${state.category} - ${state.subcategory}\n📍 ${state.address.street}\n🕐 ${state.slot}\n\nConfirm?`
      : `📋 Booking:\n\n${state.category} - ${state.subcategory}\n📍 ${state.address.street}\n🕐 ${state.slot}\n\nConfirm?`;

    await this.whatsapp.sendButtons(
      message.from,
      summary,
      [
        { id: 'confirm_yes', title: '✅ Yes' },
        { id: 'confirm_no', title: '❌ No' }
      ]
    );
  }

  private async handleConfirm(message: IncomingMessage, state: ConversationState, customer: any): Promise<void> {
    if (message.buttonReply?.id === 'confirm_yes') {
      const text = state.language === 'hi'
        ? '🎉 Done! Vendor आपको 10 min में call करेगा।\n\nBooking ID: ' + state.leadId
        : '🎉 Done! Vendor will call you in 10 mins.\n\nBooking ID: ' + state.leadId;

      await this.whatsapp.sendText(message.from, text);

      // Assign to best vendor (simplified)
      const lead = await prisma.lead.findUnique({ where: { id: state.leadId } });
      if (lead) {
        const matches = await this.matchingService.findMatches(lead);
        if (matches.length > 0) {
          await prisma.assignment.create({
            data: {
              leadId: lead.id,
              vendorId: matches[0].vendorId,
              matchScore: matches[0].score,
              status: 'PENDING'
            }
          });
        }
      }

      // Reset state
      state.step = 'START';
      await this.sessionService.setState(message.from, state);
    } else {
      await this.handleStart(message, state);
    }
  }

  private async getOrCreateCustomer(phoneNumber: string) {
    let customer = await prisma.customer.findUnique({
      where: { phoneNumber }
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: { phoneNumber }
      });
      logger.info({ phoneNumber }, 'New customer created');
    }

    return customer;
  }
}
