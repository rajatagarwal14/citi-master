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
    const message = `🏘️ *Welcome to Citi Master!*

Your trusted local services platform managed by experienced professionals.

🔹 *For Customers:*
Book AC, Cleaning, Plumbing, Electrical, Painting & more services instantly via WhatsApp!

🔹 *For Service Providers:*
Join our vendor network and grow your business with guaranteed leads.

Reply with:
📱 *BOOK* - Book a service
👷 *PARTNER* - Become a vendor
❓ *HELP* - Learn more`;

    await this.whatsapp.sendText(phoneNumber, message);
    
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

    if (customer) {
      await this.whatsapp.sendText(
        phoneNumber,
        `👋 Welcome back ${customer.name || 'there'}!\n\nWhat service do you need today?`
      );
      await this.sendServiceCategories(phoneNumber);
      return;
    }

    // New customer - ask for name
    await this.whatsapp.sendText(
      phoneNumber,
      `👋 Hi! I'm your Citi Master assistant.\n\nTo get started, what's your name?`
    );

    // Create pending customer record
    await prisma.customer.create({
      data: { phoneNumber }
    });
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
    let helpMsg = '';

    if (userType === 'customer' || userType === 'general') {
      helpMsg += `📱 *For Customers:*

🔹 Type "BOOK" to start booking
🔹 We connect you with verified local vendors
🔹 Transparent pricing
🔹 Quick service (same day/next day)
🔹 Pay after service completion
🔹 Rate & review vendors

💡 *How it works:*
1. Tell us your need (AC repair, cleaning, etc)
2. Share your address
3. Choose preferred time slot
4. Get 3 best vendor matches
5. Confirm booking
6. Vendor arrives at scheduled time
7. Pay after job done

`;
    }

    if (userType === 'vendor' || userType === 'general') {
      helpMsg += `👷 *For Vendors/Partners:*

🔹 Type "PARTNER" to register
🔹 Get verified customer leads daily
🔹 ${(config.business.commissionRate * 100)}% commission per booking
🔹 No upfront fees
🔹 Build your reputation with ratings
🔹 Optional featured placement for more visibility

📊 *Benefits:*
• Consistent income stream
• Professional platform
• On-time payments (T+2)
• Marketing & customer support handled
• Focus only on service delivery

`;
    }

    helpMsg += `\n📞 *Support:*
WhatsApp: +${config.whatsapp.phoneNumberId}
Hours: 9 AM - 9 PM (Mon-Sat)

🌐 *Service Areas:*
Currently serving Delhi NCR
Expanding to more cities soon!`;

    await this.whatsapp.sendText(phoneNumber, helpMsg);
  }

  /**
   * Smart first message handler
   */
  async handleFirstContact(phoneNumber: string, message: string): Promise<void> {
    const lowerMsg = message.toLowerCase().trim();

    // Check intent from message
    if (lowerMsg.includes('book') || lowerMsg.includes('service') || lowerMsg.includes('chahiye') || lowerMsg.includes('need')) {
      await this.startCustomerOnboarding(phoneNumber);
      return;
    }

    if (lowerMsg.includes('partner') || lowerMsg.includes('vendor') || lowerMsg.includes('join') || lowerMsg.includes('business')) {
      await this.startVendorOnboarding(phoneNumber);
      return;
    }

    if (lowerMsg.includes('help') || lowerMsg.includes('info') || lowerMsg === 'hi' || lowerMsg === 'hello') {
      await this.sendWelcomeIntro(phoneNumber);
      return;
    }

    // Default: Show welcome with options
    await this.sendWelcomeIntro(phoneNumber);
  }
}
