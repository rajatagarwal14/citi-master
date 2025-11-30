import { config } from '../src/config';
import { WhatsAppClient } from '../src/utils/whatsapp-client';

const phoneNumber = '+919999663120'; // Your test number

async function testCompleteFlow() {
  const whatsapp = new WhatsAppClient();

  console.log('🧪 Testing Complete Onboarding Flow\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Test 1: Welcome message with platform intro
  console.log('1️⃣  Sending welcome introduction...');
  await whatsapp.sendText(
    phoneNumber,
    `🏘️ *Welcome to Citi Master!*

Your trusted local services platform managed by experienced professionals.

🔹 *For Customers:*
Book AC, Cleaning, Plumbing, Electrical, Painting & more services instantly via WhatsApp!

🔹 *For Service Providers:*
Join our vendor network and grow your business with guaranteed leads.

Reply with:
📱 *BOOK* - Book a service
👷 *PARTNER* - Become a vendor
❓ *HELP* - Learn more`
  );
  console.log('✅ Welcome message sent\n');

  await sleep(2000);

  // Test 2: Customer onboarding
  console.log('2️⃣  Sending customer onboarding flow...');
  await whatsapp.sendText(
    phoneNumber,
    `👋 Hi! I'm your Citi Master assistant.\n\nTo get started, what's your name?`
  );
  console.log('✅ Customer onboarding started\n');

  await sleep(2000);

  // Test 3: Service categories list
  console.log('3️⃣  Sending service categories...');
  await whatsapp.sendList(
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
  console.log('✅ Service categories sent\n');

  await sleep(2000);

  // Test 4: Vendor onboarding
  console.log('4️⃣  Sending vendor onboarding...');
  await whatsapp.sendButtons(
    phoneNumber,
    `👷 *Partner Onboarding*

Join Citi Master's vendor network!

📋 *What you'll get:*
• Guaranteed customer leads
• No listing fees
• Quick payments (T+2)
• Rating & reviews system
• Featured placement options

💰 *Commission:* 15% per completed booking

📝 *Registration Steps:*
1. Business name
2. Owner name  
3. Services offered
4. Service areas (pincodes)
5. Bank details

⏱️ Takes only 5 minutes!

Reply *START* to begin registration`,
    [
      { id: 'vendor_start', title: '✅ Start Now' },
      { id: 'vendor_info', title: 'ℹ️ More Info' },
      { id: 'vendor_cancel', title: '❌ Not Now' }
    ]
  );
  console.log('✅ Vendor onboarding sent\n');

  await sleep(2000);

  // Test 5: Help/Info message
  console.log('5️⃣  Sending help information...');
  await whatsapp.sendText(
    phoneNumber,
    `📱 *For Customers:*

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

👷 *For Vendors/Partners:*

🔹 Type "PARTNER" to register
🔹 Get verified customer leads daily
🔹 15% commission per booking
🔹 No upfront fees
🔹 Build your reputation with ratings

📞 *Support:*
WhatsApp: +${config.whatsapp.phoneNumberId}
Hours: 9 AM - 9 PM (Mon-Sat)

🌐 Service Areas: Delhi NCR`
  );
  console.log('✅ Help info sent\n');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('✅ Complete flow tested!\n');
  console.log('📱 Check your WhatsApp (+919999663120)\n');
  console.log('You should receive:');
  console.log('  1. Platform welcome & introduction');
  console.log('  2. Customer onboarding prompt');
  console.log('  3. Service categories list (interactive)');
  console.log('  4. Vendor onboarding with buttons');
  console.log('  5. Detailed help information');
  console.log('\n💡 Reply to any message to start the flow!\n');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

testCompleteFlow().catch(console.error);
