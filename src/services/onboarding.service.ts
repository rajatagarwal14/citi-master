import { WhatsAppClient } from '../utils/whatsapp-client';
import { prisma } from '../utils/db';
import { logger } from '../utils/logger';
import { config } from '../config';

export class OnboardingService {
  private whatsapp = new WhatsAppClient();

  /**
   * Send welcome message with platform introduction
   */
  async sendWelcomeIntro(phoneNumber: string): Promise<void> {
    await this.whatsapp.sendButtons(
      phoneNumber,
      `🏘️ *Welcome to Citi Master!*

Book home services instantly via WhatsApp

🛠️ AC • Cleaning • Plumbing • Electrical • Painting

📍 Serving: Delhi NCR | Jhansi

What brings you here?`,
      [
        { id: 'start_customer', title: '📱 Book Service' },
        { id: 'start_vendor', title: '👷 Become Partner' },
        { id: 'start_help', title: '❓ Learn More' }
      ]
    );
    
    logger.info({ phoneNumber }, 'Welcome intro sent');
  }

  /**
   * Complete customer onboarding flow
   */
  async startCustomerOnboarding(phoneNumber: string): Promise<void> {
    // Check if already registered
    let customer = await prisma.customer.findUnique({
      where: { phoneNumber }
    });

    if (customer && customer.name) {
      // Returning customer - show services directly
      await this.sendServiceCategories(phoneNumber);
      return;
    }

    // New customer - show services immediately (no name collection for now)
    if (!customer) {
      await prisma.customer.create({
        data: { phoneNumber }
      });
    }

    await this.sendServiceCategories(phoneNumber);
  }

  /**
   * Complete vendor onboarding flow
   */
  async startVendorOnboarding(phoneNumber: string): Promise<void> {
    const existingVendor = await prisma.vendor.findUnique({
      where: { phoneNumber }
    });

    if (existingVendor) {
      await this.whatsapp.sendText(
        phoneNumber,
        `✅ You're already registered as: *${existingVendor.businessName}*\n\nStatus: ${existingVendor.isActive ? '🟢 Active' : '🔴 Inactive'}`
      );
      return;
    }

    const onboardingMsg = `👷 *Partner Onboarding*

Join Citi Master's vendor network!

📋 *What you'll get:*
• Guaranteed customer leads
• No listing fees
• Quick payments (T+2)
• Rating & reviews system
• Featured placement options

💰 *Commission:*
${(config.business.commissionRate * 100)}% per completed booking

📝 *Registration Steps:*
1. Business name
2. Owner name  
3. Services offered
4. Service areas (pincodes)
5. Bank details
6. GST (if applicable)

⏱️ Takes only 5 minutes!

Reply *START* to begin registration`;

    await this.whatsapp.sendButtons(
      phoneNumber,
      onboardingMsg,
      [
        { id: 'vendor_start', title: '✅ Start Now' },
        { id: 'vendor_info', title: 'ℹ️ More Info' },
        { id: 'vendor_cancel', title: '❌ Not Now' }
      ]
    );
  }

  /**
   * Send service categories
   */
  async sendServiceCategories(phoneNumber: string): Promise<void> {
    await this.whatsapp.sendList(
      phoneNumber,
      '🛠️ What service do you need?',
      'Select Service',
      [
        {
          title: 'Popular Services',
          rows: [
            { id: 'cat_AC', title: '❄️ AC Service', description: 'Repair, Install, Service' },
            { id: 'cat_CLEANING', title: '🧹 Cleaning', description: 'Deep clean, Regular, Kitchen' },
            { id: 'cat_PLUMBING', title: '🔧 Plumbing', description: 'Leak, Pipe, Bathroom' },
          ]
        },
        {
          title: 'More Services',
          rows: [
            { id: 'cat_ELECTRICAL', title: '⚡ Electrical', description: 'Wiring, Switch, MCB' },
            { id: 'cat_PAINTING', title: '🎨 Painting', description: 'Interior, Exterior, Touch-up' },
            { id: 'cat_CARPENTER', title: '🪚 Carpentry', description: 'Furniture, Repair, Polish' },
          ]
        }
      ]
    );
  }

  /**
   * Handle vendor registration step-by-step
   */
  async handleVendorRegistrationStep(
    phoneNumber: string,
    step: 'business_name' | 'owner_name' | 'services' | 'areas' | 'complete',
    response: string
  ): Promise<void> {
    // TODO: Implement full multi-step vendor registration
    // For now, simplified version
    
    switch (step) {
      case 'business_name':
        await this.whatsapp.sendText(phoneNumber, `✅ Business: ${response}\n\nNow, what's your name (owner/contact person)?`);
        break;
        
      case 'owner_name':
        await this.whatsapp.sendText(phoneNumber, `✅ Owner: ${response}\n\nWhich services do you provide?\n\nExample: AC Repair, AC Installation, AC Service`);
        break;
        
      case 'services':
        await this.whatsapp.sendText(phoneNumber, `✅ Services noted!\n\nWhich areas do you serve? (Send pincodes)\n\nExample: 110001, 110002, 110003`);
        break;
        
      case 'areas':
        await this.whatsapp.sendText(
          phoneNumber,
          `✅ Service areas added!\n\n📱 *Registration Complete!*\n\nOur team will verify your details within 24 hours.\n\nYou'll start receiving leads once approved.\n\nWelcome to Citi Master! 🎉`
        );
        break;
    }
  }

  /**
   * Send help/info message
   */
  async sendHelpInfo(phoneNumber: string, userType: 'customer' | 'vendor' | 'general'): Promise<void> {
    if (userType === 'customer') {
      await this.whatsapp.sendText(
        phoneNumber,
        `📱 *How Booking Works:*

1. Select service (AC, Plumbing, etc)
2. Choose type (Repair, Installation)
3. Share address with pincode
4. Pick date & time
5. Get 3 matched vendors
6. Confirm booking
7. Pay after service done ✅

🌐 *Available in:* Delhi NCR | Jhansi

💬 Reply "BOOK" to start`
      );
    } else if (userType === 'vendor') {
      await this.whatsapp.sendText(
        phoneNumber,
        `👷 *Partner Benefits:*

✅ Get verified customer leads
✅ ${(config.business.commissionRate * 100)}% commission only
✅ No listing fees
✅ Quick payments (T+2)
✅ Build reputation with ratings

📝 *5-min Registration:*
Business name → Services → Areas → Bank details

💬 Reply "PARTNER" to register`
      );
    } else {
      // General help
      await this.whatsapp.sendButtons(
        phoneNumber,
        `ℹ️ *About Citi Master*

Local services platform connecting customers with verified vendors

🛠️ Services: AC, Cleaning, Plumbing, Electrical, Painting, Carpentry

📍 Areas: Delhi NCR | Jhansi

⏰ Support: 9 AM - 9 PM (Mon-Sat)

What would you like to do?`,
        [
          { id: 'help_book', title: '📱 Book Service' },
          { id: 'help_partner', title: '👷 Become Partner' },
        ]
      );
    }
  }

  /**
   * Smart first message handler
   */
  async handleFirstContact(phoneNumber: string, message: string): Promise<void> {
    const lowerMsg = message.toLowerCase().trim();

    // Check intent from message
    if (lowerMsg.includes('book') || lowerMsg.includes('service') || lowerMsg.includes('chahiye') || lowerMsg.includes('need')) {
      await this.sendServiceCategories(phoneNumber);
      return;
    }

    if (lowerMsg.includes('partner') || lowerMsg.includes('vendor') || lowerMsg.includes('join') || lowerMsg.includes('business')) {
      await this.startVendorOnboarding(phoneNumber);
      return;
    }

    // Default: Show welcome with buttons
    await this.sendWelcomeIntro(phoneNumber);
  }
}
