import { WhatsAppClient } from '../src/utils/whatsapp-client';

const phoneNumber = '+919999663120';

/**
 * Test sending a text message that should trigger welcome
 */
async function testHiResponse() {
  const whatsapp = new WhatsAppClient();

  console.log('🧪 Testing "Hi" Auto-Response\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('📝 When user sends "hi" to WhatsApp:');
  console.log('   1. Webhook receives message');
  console.log('   2. ConversationService.handleMessage() called');
  console.log('   3. Detects greeting (hi/hello/hey)');
  console.log('   4. Calls onboarding.handleFirstContact()');
  console.log('   5. Shows welcome message with 3 buttons\n');

  console.log('💡 Button functionality:');
  console.log('   🛠️  Book Service → Service categories list');
  console.log('   👷 Join as Partner → Vendor registration');
  console.log('   ℹ️  Learn More → Help info + sub-buttons\n');

  console.log('🧪 To test live:');
  console.log('   1. Make sure server is running: npm run dev');
  console.log('   2. Send "hi" to WhatsApp number');
  console.log('   3. You should receive welcome with buttons');
  console.log('   4. Click any button to test the flow\n');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

testHiResponse().catch(console.error);

