import { config } from '../src/config';
import { WhatsAppClient } from '../src/utils/whatsapp-client';

const phoneNumber = '+919999663120';

async function testWelcome() {
  const whatsapp = new WhatsAppClient();

  console.log('🧪 Testing World-Class Welcome Message\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('📱 Sending ONE professional welcome message...');
  
  await whatsapp.sendButtons(
    phoneNumber,
    `🏘️ *Citi Master* – Your Local Services Partner

Premium home services at your doorstep

*Services Available:*
❄️ AC Repair & Service
🧹 Deep Cleaning
🔧 Plumbing Solutions
⚡ Electrical Work
🎨 Painting & More

*Why Choose Us:*
✓ Verified professionals
✓ Transparent pricing
✓ Same/next day service
✓ Guaranteed satisfaction

📍 *Serving:* Delhi NCR | Jhansi
⏰ *Available:* 9 AM - 9 PM

*How can we help you today?*`,
    [
      { id: 'customer_book', title: '🛠️ Book Service' },
      { id: 'vendor_join', title: '👷 Join as Partner' },
      { id: 'more_info', title: 'ℹ️ Learn More' }
    ]
  );

  console.log('✅ Message sent!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📱 Check WhatsApp (+919999663120)\n');
  console.log('\n💡 User receives ONE clean, professional message');
  console.log('   with 3 clear action buttons\n');
}

testWelcome().catch(console.error);
