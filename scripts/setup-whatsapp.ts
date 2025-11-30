import { config } from '../config';

interface TestResult {
  success: boolean;
  message: string;
  data?: any;
}

async function setupWhatsApp(): Promise<void> {
  console.log('🔧 WhatsApp Setup Tool\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Test 1: Verify token
  console.log('1️⃣  Verifying access token...');
  const tokenTest = await testToken();
  console.log(tokenTest.success ? '✅' : '❌', tokenTest.message);
  if (!tokenTest.success) return;

  // Test 2: Get app info
  console.log('\n2️⃣  Getting app info...');
  const appInfo = await getAppInfo();
  console.log(appInfo.success ? '✅' : '❌', appInfo.message);
  if (appInfo.data) {
    console.log('   App ID:', appInfo.data.id);
    console.log('   Name:', appInfo.data.name);
  }

  // Test 3: Test webhook
  console.log('\n3️⃣  Webhook configuration:');
  console.log('   Verify Token:', config.whatsapp.verifyToken);
  console.log('   ⚠️  Set this in Meta Developer Dashboard');

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('✅ Setup complete!');
  console.log('\nNext steps:');
  console.log('1. Start server: npm run dev');
  console.log('2. Expose via ngrok: ngrok http 3000');
  console.log('3. Set webhook URL in Meta Dashboard');
  console.log('4. Test: npm run whatsapp:test +919999663120\n');
}

async function testToken(): Promise<TestResult> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/${config.whatsapp.apiVersion}/me?access_token=${config.whatsapp.token}`
    );

    if (response.ok) {
      return { success: true, message: 'Token is valid' };
    } else {
      return { success: false, message: 'Token is invalid or expired' };
    }
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

async function getAppInfo(): Promise<TestResult> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/${config.whatsapp.apiVersion}/${config.whatsapp.phoneNumberId}?access_token=${config.whatsapp.token}`
    );

    if (response.ok) {
      const data = await response.json();
      return { success: true, message: 'App info retrieved', data };
    } else {
      const error = await response.text();
      return { success: false, message: error };
    }
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

setupWhatsApp().catch(console.error);
