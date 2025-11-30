# Complete User Flow Testing Guide

## ✅ All Functionality Working

### 1️⃣ When User Sends "hi" (or hello, hey, start)
**File:** `src/services/conversation.service.ts` (line 22-29)

```
User: "hi"
  ↓
ConversationService detects greeting
  ↓
Calls onboarding.handleFirstContact()
  ↓
Sends ONE welcome message with 3 buttons:
  - 🛠️ Book Service
  - 👷 Join as Partner  
  - ℹ️ Learn More
```

**Test:** Send "hi" via WhatsApp → Receive professional welcome

---

### 2️⃣ User Clicks "🛠️ Book Service" Button
**File:** `src/services/conversation.service.ts` (line 33-36)

```
User clicks: customer_book button
  ↓
Calls onboarding.sendServiceCategories()
  ↓
Shows interactive LIST with 6 services:

Popular Services:
  ❄️ AC Service (Repair, Install, Service)
  🧹 Cleaning (Deep clean, Regular, Kitchen)
  🔧 Plumbing (Leak, Pipe, Bathroom)

More Services:
  ⚡ Electrical (Wiring, Switch, MCB)
  🎨 Painting (Interior, Exterior, Touch-up)
  🪚 Carpentry (Furniture, Repair, Polish)
```

**Next Steps:**
- User selects service → Gets subcategory options
- Selects subcategory → Asked for address
- Provides address → Gets time slot options
- Confirms slot → Matched with 3 vendors
- Selects vendor → Booking confirmed!

**Full Booking Flow:**
```
START → CATEGORY → SUBCATEGORY → ADDRESS → SLOT → CONFIRM → ASSIGNED
```

---

### 3️⃣ User Clicks "👷 Join as Partner" Button
**File:** `src/services/conversation.service.ts` (line 38-41)

```
User clicks: vendor_join button
  ↓
Calls onboarding.startVendorOnboarding()
  ↓
Sends vendor registration message:

👷 Partner Onboarding

Join Citi Master's vendor network!

📋 What you'll get:
• Guaranteed customer leads
• No listing fees
• Quick payments (T+2)
• Rating & reviews system
• Featured placement options

💰 Commission:
15% per completed booking

📝 Registration Steps:
1. Business name
2. Owner name
3. Services offered
4. Service areas (pincodes)
5. Bank details
6. GST (if applicable)

⏱️ Takes only 5 minutes!

Reply START to begin registration
```

**Next Steps:**
- User replies "START"
- Multi-step registration begins
- After completion → Vendor added to database
- Team verifies within 24h
- Starts receiving leads!

---

### 4️⃣ User Clicks "ℹ️ Learn More" Button
**File:** `src/services/conversation.service.ts` (line 43-46)

```
User clicks: more_info button
  ↓
Calls onboarding.sendHelpInfo('general')
  ↓
Shows help message with 2 sub-buttons:

ℹ️ About Citi Master

Local services platform connecting customers with verified vendors

🛠️ Services: AC, Cleaning, Plumbing, Electrical, Painting, Carpentry

📍 Areas: Delhi NCR | Jhansi

⏰ Support: 9 AM - 9 PM (Mon-Sat)

What would you like to do?
  
[📱 Book Service]  [👷 Become Partner]
```

**Next Steps:**
- User clicks "Book Service" → Goes to step 2️⃣
- User clicks "Become Partner" → Goes to step 3️⃣

---

## 🎯 Key Features Working

### Language Detection (Grok AI)
- Automatically detects Hindi/English
- Responds in user's language
- Works throughout entire conversation

### Smart Intent Parsing (Grok AI)
If user types:
- "I need AC repair" → Auto-detects service, skips category selection
- "मुझे प्लंबर चाहिए" → Detects Hindi + plumbing service
- "Book cleaning service" → Starts booking flow directly

### Address Parsing (Grok AI)
User sends: "B-123, Karol Bagh, New Delhi 110005"
- Extracts: pincode 110005
- Matches vendors in that area
- Shows distance from user

### Vendor Matching Algorithm
**Score = 0.35×proximity + 0.25×rating + 0.20×priceFit + 0.20×acceptRate**

Returns top 3 vendors:
```
🥇 Amit AC Services (4.8★)
   📍 2.3 km away | ₹500-800
   
🥈 Cool Tech Repairs (4.5★)
   📍 3.1 km away | ₹450-700
   
🥉 Delhi AC Masters (4.7★)
   📍 4.2 km away | ₹600-900
```

---

## 🧪 Testing Commands

### Test Welcome Message
```bash
npm run test:welcome
# or
npx tsx scripts/test-welcome.ts
```

### Test Full Onboarding (OLD - sends multiple messages)
```bash
npm run onboarding:test
# or
npx tsx scripts/test-onboarding.ts
```

### View Button Flow Info
```bash
npx tsx scripts/test-hi.ts
```

---

## 🚀 Deployment Checklist

### Environment Variables (Render)
```env
WHATSAPP_TOKEN=EAAchkiYy760BQ...
WHATSAPP_PHONE_NUMBER_ID=938750415977890
WHATSAPP_VERIFY_TOKEN=citi_master_secure_webhook_token_2025
GROK_API_KEY=gsk_nflXgl06f0G1lnHRNwVq...
ADMIN_PASSWORD=citimaster2025
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
PORT=3000
NODE_ENV=production
```

### Webhook Configuration (Meta Business)
1. Go to: https://developers.facebook.com/apps
2. Select your app → WhatsApp → Configuration
3. Set webhook URL: `https://your-render-app.onrender.com/webhook`
4. Verify token: `citi_master_secure_webhook_token_2025`
5. Subscribe to: `messages` field
6. Save and test!

---

## 📊 Admin Dashboard
Access: `https://your-app.com/dashboard`
Password: `citimaster2025`

**Metrics Shown:**
- Total messages (7-day)
- Active leads
- Completed bookings today
- Average response time
- Active vendors
- Total revenue

**Tables:**
- Recent leads with status
- Top vendors by rating
- Recent messages log

---

## 🎉 Summary

**✅ EVERYTHING WORKS!**

1. **Text "hi"** → Welcome message with 3 buttons
2. **Click "Book Service"** → Complete booking flow with:
   - Service selection (interactive list)
   - Subcategory selection
   - Address input with AI parsing
   - Time slot selection
   - Vendor matching (top 3)
   - Booking confirmation
3. **Click "Join as Partner"** → Vendor registration flow
4. **Click "Learn More"** → Help info + navigation buttons

**Powered by:**
- WhatsApp Cloud API ✅
- Grok AI (language, intent, address) ✅
- Smart vendor matching ✅
- Session management (Redis) ✅
- PostgreSQL database ✅
- Real-time admin dashboard ✅

**Ready for:** Production deployment on Render! 🚀
