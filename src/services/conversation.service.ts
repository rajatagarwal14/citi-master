import { IncomingMessage, ConversationState, CATEGORIES, SUBCATEGORIES } from '../types';
import { SessionService } from './session.service';
import { WhatsAppClient } from '../utils/whatsapp-client';
import { firebaseDb } from '../utils/firebase-db';
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
      const greetings = ['hi', 'hello', 'hey', 'start'];
      const isGreeting = greetings.some(g => message.text!.toLowerCase().includes(g));
      
      if (isGreeting) {
        await this.onboarding.handleFirstContact(message.from, message.text);
        return;
      }
    }

    // Handle button responses from welcome screen
    if (message.buttonReply?.id === 'customer_book') {
      await this.onboarding.sendServiceCategories(message.from);
      return;
    }

    if (message.buttonReply?.id === 'vendor_join') {
      await this.onboarding.startVendorOnboarding(message.from);
      return;
    }

    if (message.buttonReply?.id === 'more_info' || message.buttonReply?.id === 'help_info') {
      await this.onboarding.sendHelpInfo(message.from, 'general');
      return;
    }

    // Handle button responses from help screen
    if (message.buttonReply?.id === 'help_book') {
      await this.onboarding.sendServiceCategories(message.from);
      return;
    }

    if (message.buttonReply?.id === 'help_partner') {
      await this.onboarding.startVendorOnboarding(message.from);
      return;
    }

    // Auto-detect language using Grok AI
    if (message.text && !state.language) {
      state.language = await this.grokAI.detectLanguage(message.text);
      await this.sessionService.setState(message.from, state);
    }

    // Log message
    await firebaseDb.logMessage({
      data: {
        phoneNumber: message.from,
        direction: 'INBOUND',
        messageType: message.type,
        content: message as any,
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
    const lead = await firebaseDb.createLead({
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
      ? `✅ ${matches.length} vendors मिले!\n\n📅 कब चाहिए service?\n\nOr type specific date & time\n(Example: Tomorrow 2 PM)`
      : `✅ Found ${matches.length} vendors!\n\n📅 When do you need service?\n\nOr type specific date & time\n(Example: Dec 1, 10 AM)`;

    await this.whatsapp.sendButtons(
      message.from,
      text,
      [
        { id: 'slot_today', title: '🔥 Today' },
        { id: 'slot_tomorrow', title: '📅 Tomorrow' },
        { id: 'slot_later', title: '⏰ Choose Time' }
      ]
    );

    state.step = 'SLOT';
    await this.sessionService.setState(message.from, state);
  }

  private async handleSlot(message: IncomingMessage, state: ConversationState): Promise<void> {
    // If button reply, it's slot selection
    if (message.buttonReply?.id) {
      state.slot = message.buttonReply.id;
      state.step = 'CONFIRM';
      await this.sessionService.setState(message.from, state);

      const summary = state.language === 'hi'
        ? `📋 Booking Summary:\n\n🛠️ Service: ${state.category} - ${state.subcategory}\n📍 Location: ${state.address.street}\n🕐 Slot: ${this.formatSlot(state.slot)}\n\nConfirm?`
        : `📋 Booking Summary:\n\n🛠️ Service: ${state.category} - ${state.subcategory}\n📍 Location: ${state.address.street}\n🕐 Slot: ${this.formatSlot(state.slot)}\n\nConfirm?`;

      await this.whatsapp.sendButtons(
        message.from,
        summary,
        [
          { id: 'confirm_yes', title: '✅ Confirm' },
          { id: 'confirm_no', title: '❌ Cancel' }
        ]
      );
    } else if (message.text) {
      // User typed custom date/time
      state.slot = message.text;
      state.step = 'CONFIRM';
      await this.sessionService.setState(message.from, state);

      const summary = state.language === 'hi'
        ? `📋 Booking:\n\n${state.category} - ${state.subcategory}\n📍 ${state.address.street}\n🕐 ${state.slot}\n\nConfirm?`
        : `📋 Booking:\n\n${state.category} - ${state.subcategory}\n📍 ${state.address.street}\n🕐 ${state.slot}\n\nConfirm?`;

      await this.whatsapp.sendButtons(
        message.from,
        summary,
        [
          { id: 'confirm_yes', title: '✅ Confirm' },
          { id: 'confirm_no', title: '❌ Cancel' }
        ]
      );
    }
  }

  private formatSlot(slot: string): string {
    const slotMap: { [key: string]: string } = {
      'slot_today': 'Today (within 4 hours)',
      'slot_tomorrow': 'Tomorrow',
      'slot_later': 'Later (you choose)'
    };
    return slotMap[slot] || slot;
  }

  private async handleConfirm(message: IncomingMessage, state: ConversationState, customer: any): Promise<void> {
    if (message.buttonReply?.id === 'confirm_yes') {
      const text = state.language === 'hi'
        ? '🎉 Done! Vendor आपको 10 min में call करेगा।\n\nBooking ID: ' + state.leadId
        : '🎉 Done! Vendor will call you in 10 mins.\n\nBooking ID: ' + state.leadId;

      await this.whatsapp.sendText(message.from, text);

      // Assign to best vendor (simplified)
      const lead = state.leadId ? await firebaseDb.getLead(state.leadId) : null;
      if (lead) {
        const matches = await this.matchingService.findMatches(lead);
        if (matches.length > 0) {
          await firebaseDb.createAssignment({
            leadId: lead.id,
            vendorId: matches[0].vendorId,
            matchScore: matches[0].score,
            status: 'PENDING'
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
    let customer = await firebaseDb.getCustomer(phoneNumber);

    if (!customer) {
      customer = await firebaseDb.createCustomer({ phoneNumber });
      logger.info({ phoneNumber }, 'New customer created');
    }

    return customer;
  }
}
