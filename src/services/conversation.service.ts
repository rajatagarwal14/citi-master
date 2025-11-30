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
      phoneNumber: message.from,
      direction: 'INBOUND',
      messageType: message.type,
      content: message as any,
      waMessageId: message.messageId,
      customerId: customer.id,
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
      await this.whatsapp.sendText(message.from, '❌ Please select a valid category from the list');
      return;
    }

    state.category = categoryId;
    state.step = 'SUBCATEGORY';
    await this.sessionService.setState(message.from, state);

    const categoryDetails = {
      'AC': { emoji: '❄️', name: 'AC Service', services: [
        { id: 'sub_REPAIR', title: '🔧 Repair', desc: 'Not cooling, noise, leaks' },
        { id: 'sub_INSTALL', title: '📦 Installation', desc: 'New AC setup & fitting' },
        { id: 'sub_SERVICE', title: '🧼 Service & Clean', desc: 'Gas fill, deep clean' }
      ]},
      'CLEANING': { emoji: '🧹', name: 'Cleaning', services: [
        { id: 'sub_DEEP', title: '💎 Deep Cleaning', desc: 'Kitchen, bathroom, full' },
        { id: 'sub_REGULAR', title: '✨ Regular Cleaning', desc: 'Daily/weekly service' },
        { id: 'sub_SOFA', title: '🛋️ Sofa/Carpet', desc: 'Upholstery cleaning' }
      ]},
      'PLUMBING': { emoji: '🔧', name: 'Plumbing', services: [
        { id: 'sub_LEAK', title: '💧 Fix Leaks', desc: 'Taps, pipes, tanks' },
        { id: 'sub_INSTALL', title: '🚰 Installation', desc: 'Taps, basin, toilet' },
        { id: 'sub_BLOCKAGE', title: '🚫 Clear Blockage', desc: 'Drain, sink, toilet' }
      ]}
    };

    const category = categoryDetails[categoryId as keyof typeof categoryDetails] || categoryDetails['AC'];
    const text = state.language === 'hi' 
      ? `${category.emoji} *${category.name}*\n\nकौनसी सर्विस चाहिए?`
      : `${category.emoji} *${category.name}*\n\nWhat do you need?`;
    
    await this.whatsapp.sendButtons(
      message.from,
      text,
      category.services.map((s: any) => ({ id: s.id, title: s.title }))
    );
  }

  private async handleSubcategory(message: IncomingMessage, state: ConversationState): Promise<void> {
    state.subcategory = message.buttonReply?.id?.replace('sub_', '') || message.text;
    state.step = 'ADDRESS';
    await this.sessionService.setState(message.from, state);

    const serviceEmoji = {
      'AC': '❄️',
      'CLEANING': '🧹',
      'PLUMBING': '🔧',
      'ELECTRICAL': '⚡',
      'PAINTING': '🎨'
    };

    const emoji = serviceEmoji[state.category as keyof typeof serviceEmoji] || '🛠️';

    const text = state.language === 'hi'
      ? `${emoji} *Perfect Choice!*\n\n✅ ${state.category} - ${state.subcategory} selected\n\n📍 *अब अपना पता share करें:*\n\n📝 Format:\nFlat/House No, Building\nArea/Locality\nLandmark (optional)\nPincode\n\n💬 *Example:*\n_Flat 301, Tower A_\n_Karol Bagh_\n_Near Metro Station_\n_Delhi 110005_`
      : `${emoji} *Perfect Choice!*\n\n✅ ${state.category} - ${state.subcategory} selected\n\n📍 *Now share your address:*\n\n📝 Format:\nFlat/House No, Building\nArea/Locality\nLandmark (optional)\nPincode\n\n💬 *Example:*\n_Flat 301, Tower A_\n_Karol Bagh_\n_Near Metro Station_\n_Delhi 110005_`;

    await this.whatsapp.sendText(message.from, text);
  }

  private async handleAddress(message: IncomingMessage, state: ConversationState, customer: any): Promise<void> {
    const addressText = message.text;
    if (!addressText) return;

    // Use Grok AI to parse address (with fallback)
    let parsedAddress: any = {};
    try {
      parsedAddress = await this.grokAI.parseAddress(addressText);
    } catch (error) {
      logger.error(error, 'Address parsing error - using fallback');
      parsedAddress = { street: addressText, city: 'Delhi', pincode: '110001' };
    }

    state.address = {
      street: parsedAddress.street || addressText,
      area: parsedAddress.area || 'Not specified',
      city: parsedAddress.city || 'Delhi',
      pincode: parsedAddress.pincode || '110001',
      landmark: parsedAddress.landmark || '',
      coordinates: { lat: 28.6139, lng: 77.2090 } // TODO: Use geocoding API
    };

    // Create lead
    const lead = await firebaseDb.createLead({
      customerId: customer.id,
      category: state.category!,
      subcategory: state.subcategory!,
      address: state.address,
      status: 'PENDING',
      customerPhone: customer.phoneNumber || message.from
    });

    state.leadId = lead.id;

    // Find matching vendors
    const matches = await this.matchingService.findMatches(lead);

    if (matches.length === 0) {
      await this.whatsapp.sendText(
        message.from,
        state.language === 'hi' 
          ? `📋 *Booking Received!*

✅ हमारी team आपको 15-20 mins में call करेगी

*Details:*
🛠️ ${state.category} - ${state.subcategory}
📍 ${state.address?.area || 'Your area'}

💬 Meanwhile, you can call us:
📞 +91-9999663120

Booking ID: ${state.leadId}`
          : `📋 *Booking Received!*

✅ Our team will call you in 15-20 mins

*Details:*
🛠️ ${state.category} - ${state.subcategory}
📍 ${state.address?.area || 'Your area'}

💬 Meanwhile, you can call us:
📞 +91-9999663120

Booking ID: ${state.leadId}`
      );
      state.step = 'START';
      await this.sessionService.setState(message.from, state);
      return;
    }

    const text = state.language === 'hi'
      ? `✅ *बढ़िया!* ${matches.length} verified professionals मिले\n\n📅 *कब चाहिए service?*\n\n⚡ Same-day available\n🕐 Flexible timing\n\n💬 या specific date/time लिखें\n_Example: Tomorrow 3 PM_`
      : `✅ *Great!* ${matches.length} verified professionals found\n\n📅 *When do you need service?*\n\n⚡ Same-day available\n🕐 Flexible timing\n\n💬 Or type specific date/time\n_Example: Tomorrow 3 PM_`;
    
    await this.whatsapp.sendButtons(
      message.from,
      text,
      [
        { id: 'slot_today', title: '🔥 Today (2-3 hrs)' },
        { id: 'slot_tomorrow', title: '📅 Tomorrow' },
        { id: 'slot_later', title: '⏰ Choose Time' }
      ]
    );    state.step = 'SLOT';
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

  private getEstimatedPrice(category: string): string {
    const priceMap: { [key: string]: string } = {
      'AC': '299',
      'CLEANING': '399',
      'PLUMBING': '199',
      'ELECTRICAL': '249',
      'PAINTING': '149/sqft',
      'CARPENTER': '399'
    };
    return priceMap[category] || '299';
  }

  private async handleConfirm(message: IncomingMessage, state: ConversationState, customer: any): Promise<void> {
    if (message.buttonReply?.id === 'confirm_yes') {
      const text = state.language === 'hi'
        ? `🎉 *बुकिंग Confirm!*\n\n✅ Professional आपको 10-15 min में call करेगा\n📞 Contact करने के लिए ready रहें\n\n*Booking Details:*\n📋 ID: ${state.leadId}\n🛠️ Service: ${state.category} - ${state.subcategory}\n📍 Area: ${state.address?.area || 'Your location'}\n⏰ Time: ${this.formatSlot(state.slot!)}\n\n_हम आपकी सेवा के लिए तत्पर हैं! 🙏_`
        : `🎉 *Booking Confirmed!*\n\n✅ Professional will call you in 10-15 mins\n📞 Please keep your phone ready\n\n*Booking Details:*\n📋 ID: ${state.leadId}\n🛠️ Service: ${state.category} - ${state.subcategory}\n📍 Area: ${state.address?.area || 'Your location'}\n⏰ Time: ${this.formatSlot(state.slot!)}\n\n_Thank you for choosing Citi Master! 🙏_`;

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
