import { config } from '../src/config';

const phoneNumber = process.argv[2];

if (!phoneNumber) {
  console.error('❌ Usage: npm run whatsapp:test <phone_number>');
  console.error('   Example: npm run whatsapp:test +919999663120');
  process.exit(1);
}

async function testWhatsApp() {
  console.log('📱 Testing WhatsApp API\n');
  console.log('To:', phoneNumber);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Test 1: Send text message
  console.log('1️⃣  Sending text message...');
  const textResult = await sendText();
  console.log(textResult.success ? '✅' : '❌', textResult.message);

  // Test 2: Send button message
  console.log('\n2️⃣  Sending button message...');
  const buttonResult = await sendButtons();
  console.log(buttonResult.success ? '✅' : '❌', buttonResult.message);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('💡 Check your WhatsApp for messages!\n');
}

async function sendText() {
  try {
    const response = await fetch(
      `https://graph.facebook.com/${config.whatsapp.apiVersion}/${config.whatsapp.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.whatsapp.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phoneNumber.replace('+', ''),
          type: 'text',
          text: {
            body: '🎉 Citi Master is ready!\n\nReply HI to start booking.'
          }
        })
      }
    );

    if (response.ok) {
      const data = await response.json();
      return { success: true, message: `Message sent (ID: ${data.messages[0].id})` };
    } else {
      const error = await response.text();
      return { success: false, message: error };
    }
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

async function sendButtons() {
  try {
    const response = await fetch(
      `https://graph.facebook.com/${config.whatsapp.apiVersion}/${config.whatsapp.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.whatsapp.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phoneNumber.replace('+', ''),
          type: 'interactive',
          interactive: {
            type: 'button',
            body: {
              text: 'What service do you need?'
            },
            action: {
              buttons: [
                { type: 'reply', reply: { id: 'cat_AC', title: 'AC Service' }},
                { type: 'reply', reply: { id: 'cat_CLEANING', title: 'Cleaning' }},
                { type: 'reply', reply: { id: 'cat_PLUMBING', title: 'Plumbing' }}
              ]
            }
          }
        })
      }
    );

    if (response.ok) {
      const data = await response.json();
      return { success: true, message: `Buttons sent (ID: ${data.messages[0].id})` };
    } else {
      const error = await response.text();
      return { success: false, message: error };
    }
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

testWhatsApp().catch(console.error);
