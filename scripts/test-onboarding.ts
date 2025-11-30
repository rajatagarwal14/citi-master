import { config } from '../src/config';
import { WhatsAppClient } from '../src/utils/whatsapp-client';

const phoneNumber = '+919999663120'; // Your test number

async function testCompleteFlow() {
  const whatsapp = new WhatsAppClient();

  console.log('🧪 Testing Complete Onboarding Flow\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Test 1: Welcome message with buttons
  console.log('1️⃣  Sending welcome with action buttons...');
  await whatsapp.sendButtons(
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
  console.log('✅ Welcome message sent\n');

  await sleep(3000);

  // Test 2: Service categories list (direct booking)
  console.log('2️⃣  Sending service categories...');
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

  // Test 3: Vendor onboarding (when user clicks Join)
  console.log('3️⃣  Sending vendor onboarding...');
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

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('✅ Complete flow tested!\n');
  console.log('📱 Check your WhatsApp (+919999663120)\n');
  console.log('You should receive 3 messages:');
  console.log('  1. Welcome with action buttons');
  console.log('  2. Service categories (interactive list)');
  console.log('  3. Vendor onboarding (for partners)');
  console.log('\n💡 Click any button to start!\n');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

testCompleteFlow().catch(console.error);
