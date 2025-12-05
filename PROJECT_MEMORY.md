# CitiMaster Project Memory & Context
**Last Updated**: December 6, 2025

## 🎯 Project Overview
**CitiMaster** - WhatsApp-first home services aggregator connecting customers with service providers across 6 categories: AC, Cleaning, Plumbing, Electrical, Painting, Carpentry.

---

## 🔑 Critical Configuration

### WhatsApp Business API
- **Business Phone**: +1 555 027 7084 (Meta Test Number)
- **Phone Number ID**: 938750415977890
- **Current Access Token**: Stored in `.env` and Render environment variables
- **Verify Token**: Stored in `.env` file
- **Webhook URL**: https://citi-master.onrender.com/webhook
- **Token Updated**: December 2, 2025 (3-month validity)

### Deployment
- **Platform**: Render
- **Service ID**: srv-d4m1npe3jp1c739l56b0
- **URL**: https://citi-master.onrender.com
- **Dashboard**: https://citi-master.onrender.com/dashboard
- **Admin Credentials**: Stored in Render environment variables
- **GitHub Repo**: https://github.com/rajatagarwal14/citi-master

### Firebase
- **Project**: promptforge-ecd6d
- **Credentials**: Stored in `.env` file (not in git)
- **Collections**: 
  - customers
  - vendors
  - leads
  - assignments
  - messages
  - payments
  - issues
  - callbacks

### Grok AI
- **API Key**: Stored in `.env` as GROK_API_KEY (not in git)
- **Model**: grok-beta
- **Purpose**: Intent parsing, address parsing, chat support

### Test Number
- **Owner's WhatsApp**: +91-9999663120
- **Note**: Must be whitelisted in Meta Developer Console to receive messages from test number

---

## 📋 Complete Feature List

### ✅ Implemented Features

#### 1. Customer Booking Flow
- Welcome message with 3 action buttons
- Service selection (6 categories via interactive list)
- Subcategory selection (specific to each service)
- Location capture (text or live location)
- Date & time scheduling
- Issue description
- Quote generation (₹800-2500 based on service complexity)
- Lead storage in Firebase

#### 2. Vendor Onboarding Flow
- Multi-step registration process
- Service category selection
- Name & business name capture
- Experience validation (minimum 2 years)
- Coverage area collection
- Complete vendor profile stored in Firebase
- State management with proper navigation

#### 3. AI-Powered Chat Support (Latest Feature - Dec 2, 2025)
- Grok AI integration for conversational support
- Chat history maintained per session
- Human callback request system
- Email collection with validation
- Issue description capture
- Dashboard tracking of callback requests
- States: CHAT, CALLBACK_REQUEST

#### 4. Admin Dashboard
- Real-time statistics (customers, vendors, leads, revenue)
- Recent leads overview
- Vendor management
- Issue tracking
- **NEW**: Callback request management
  - GET /api/callbacks - View all callback requests
  - POST /api/callbacks/:id/status - Update status

#### 5. Session Management
- Redis-based state persistence
- 24-hour session timeout
- Conversation flow tracking
- Chat message history storage

---

## 🏗️ Technical Architecture

### Stack
```
Backend: Node.js 20 + TypeScript 5.3
Framework: Express 4.18
Database: Firebase Firestore
Cache: Redis (Upstash)
AI: Grok Beta (via OpenAI SDK)
API: WhatsApp Cloud API v22.0
Hosting: Render
```

### Key Services
1. **ConversationService** - Main message router and flow orchestration
2. **ChatSupportService** - Grok AI chat and callback handling
3. **GrokAIService** - AI integration (intent, address, chat)
4. **WhatsAppClient** - Message sending and formatting
5. **SessionService** - Redis state management

### State Machine
```
INITIAL → SERVICE_SELECTION → SUBCATEGORY → LOCATION → 
DATE → TIME → DESCRIPTION → QUOTE → END

Alternative Paths:
- VENDOR_* (onboarding flow)
- CHAT (AI support)
- CALLBACK_REQUEST (human escalation)
```

---

## 🐛 Known Issues & Resolutions

### Issue 1: Token Expiration (Nov 30, 2025)
**Problem**: Bot stopped responding after Nov 30
**Root Cause**: WhatsApp access token expired (24-hour test token)
**Solution**: Generated 3-month token, updated in Render env vars
**Prevention**: Monitor token expiry, use permanent System User tokens for production

### Issue 2: Service Category Display
**Problem**: Fan repair showing AC/Cleaning/Plumbing instead of Electrical
**Root Cause**: Only 3 services shown instead of 6
**Solution**: Changed from 3 buttons to interactive list with all 6 services
**Commit**: Part of service flow improvements

### Issue 3: Personal Phone Number Exposure
**Problem**: Personal number +91-9999663120 visible in messages
**Solution**: Replaced all occurrences with 1800-CITIMSTR
**Security**: Personal numbers never committed to git

### Issue 4: Build Errors (Dec 2, 2025)
**Problem**: TypeScript compilation failed with import errors
**Errors**:
- Duplicate ChatSupportService import in conversation.service.ts
- Missing firebaseDb import in dashboard.ts
**Solution**: 
- Removed duplicate import at line 11
- Added firebaseDb import to dashboard.ts
**Lesson**: Verify sed command results, check for duplicates

### Issue 5: Test Number Limitations
**Problem**: Messages not reaching +91-9999663120
**Root Cause**: Meta test number (+1 555 027 7084) can only message whitelisted numbers
**Solution**: Add recipient to test user list in Meta Developer Console
**Production Note**: Need real business number for production deployment

---

## 📊 Service Categories & Pricing

### Services
1. **AC Service** - Installation, Repair, Maintenance, Gas Refill
2. **Cleaning** - Deep Clean, Regular Clean, Kitchen, Bathroom
3. **Plumbing** - Pipe Repair, Tap Fix, Drainage, Water Tank
4. **Electrical** - Wiring, Fan Repair, Light Fix, Switch Repair
5. **Painting** - Interior, Exterior, Touch-up, Full House
6. **Carpentry** - Furniture Repair, Door Fix, Cabinet, Custom Work

### Pricing Logic
- **Low complexity**: ₹800-1200
- **Medium complexity**: ₹1200-1800
- **High complexity**: ₹1800-2500

### Coverage Areas
Gurgaon, Noida, Delhi NCR, Faridabad, Ghaziabad

### Commission
20% on all completed bookings

---

## 🔄 Recent Development Timeline

### Phase 1-22 (Nov 30, 2025)
- MVP built and deployed
- Customer booking flow complete
- Basic dashboard operational

### Phase 23 (Dec 1, 2025)
- Fixed service category flow (6 services instead of 3)
- Removed personal phone number

### Phase 24-26 (Dec 1, 2025)
- Added complete vendor onboarding flow
- Implemented proper state management

### Phase 27-29 (Dec 2, 2025)
- Implemented Grok AI chat support
- Added callback request system
- Extended ConversationState types
- Created ChatSupportService (175 lines)
- Added callbacks collection to Firebase
- Built callback management API endpoints
- Fixed build errors (duplicate imports)
- Deployed successfully

### Phase 30 (Dec 2, 2025)
- Token expiration identified
- Updated to 3-month validity token
- Triggered Render restart
- Documented troubleshooting steps

---

## 🔧 How to Resume Work

### When System Restarts
1. **Check Last Commit**:
   ```bash
   cd ~/citi-master
   git log --oneline -5
   ```

2. **Verify Service Status**:
   ```bash
   curl https://citi-master.onrender.com/health
   ```

3. **Test WhatsApp Bot**:
   - Message +1 555 027 7084 with "hi"
   - Should receive welcome message with buttons

4. **Check Environment**:
   ```bash
   cat .env | grep -E "WHATSAPP_TOKEN|PHONE_NUMBER_ID|GROK_API_KEY"
   ```

5. **Review Dashboard**:
   - Open https://citi-master.onrender.com/dashboard
   - Login: admin / citimaster2025

### Common Commands
```bash
# Build
npm run build

# Run locally
npm run dev

# Deploy
git add -A
git commit -m "Description"
git push

# Check logs
curl https://citi-master.onrender.com/webhook -v

# Test message
curl -X POST "https://graph.facebook.com/v22.0/938750415977890/messages" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"messaging_product":"whatsapp","to":"919999663120","type":"text","text":{"body":"Test"}}'
```

---

## 📁 Key Files & Their Purpose

### Core Services
- `src/services/conversation.service.ts` - Main message router
- `src/services/chat-support.service.ts` - Grok AI chat (NEW)
- `src/services/grok-ai.service.ts` - AI integration
- `src/services/whatsapp-client.service.ts` - Message sending
- `src/services/session.service.ts` - State management

### Configuration
- `src/types/index.ts` - TypeScript definitions (includes CHAT/CALLBACK_REQUEST states)
- `src/utils/firebase.ts` - Firebase initialization
- `src/utils/firebase-db.ts` - Database operations (includes callback CRUD)
- `.env` - Environment variables (NOT in git)

### Routes
- `src/routes/webhook.ts` - WhatsApp webhook handler
- `src/routes/dashboard.ts` - Admin dashboard (includes callback endpoints)

### Entry Point
- `src/index.ts` - Express server setup

---

## 🎯 Next Steps & Future Enhancements

### Immediate Priorities
1. ✅ Token management (3-month token active)
2. ⏳ Add test number to whitelist (owner action)
3. ⏳ Test complete flows end-to-end
4. ⏳ Verify callback request dashboard display

### Production Readiness
- [ ] Replace test number with real business number
- [ ] Add payment gateway integration
- [ ] Implement vendor assignment algorithm
- [ ] Add SMS/Email notifications
- [ ] Set up monitoring and alerts
- [ ] Add rate limiting
- [ ] Implement error recovery
- [ ] Add analytics tracking

### Feature Enhancements
- [ ] Multi-language support (Hindi, English)
- [ ] Image upload for issues
- [ ] Real-time vendor tracking
- [ ] Customer reviews and ratings
- [ ] Automated vendor matching
- [ ] Invoice generation
- [ ] Recurring bookings
- [ ] Referral system

---

## 💾 Memory & Context Preservation

### How Context is Preserved

1. **Git History**: All code changes committed with descriptive messages
   ```bash
   git log --all --oneline --graph
   ```

2. **This Document**: PROJECT_MEMORY.md captures:
   - Technical decisions
   - Issue resolutions
   - Configuration details
   - Feature evolution

3. **Code Comments**: Critical business logic documented inline

4. **Firebase Data**: All conversations and state persisted

5. **Environment Variables**: Stored in Render (production) and .env (local)

### Context Retrieval After System Update

**Step 1**: Read this document first
```bash
cat ~/citi-master/PROJECT_MEMORY.md
```

**Step 2**: Check recent commits
```bash
cd ~/citi-master && git log --oneline --date=short --pretty=format:"%h %ad %s" -10
```

**Step 3**: Review current state
```bash
# Check deployed version
curl https://citi-master.onrender.com/health

# Check local environment
cat .env | grep -E "TOKEN|KEY|ID"

# Check recent Firebase data
# Use Firebase Console: https://console.firebase.google.com/project/promptforge-ecd6d
```

**Step 4**: Verify integrations
- WhatsApp: Send test message to +1 555 027 7084
- Dashboard: Open https://citi-master.onrender.com/dashboard
- Grok AI: Check if chat support responds

### Important Context Indicators

**When bot not responding**:
1. Check token expiry first
2. Verify Render service is running
3. Check webhook subscription in Meta Console
4. Verify test number whitelist

**When adding features**:
1. Update ConversationState in src/types/index.ts
2. Extend firebase-db.ts for new collections
3. Add to conversation.service.ts main router
4. Update dashboard if admin view needed
5. Test with actual WhatsApp messages
6. Commit with descriptive message
7. Update this PROJECT_MEMORY.md

**When debugging**:
1. Check Render logs (dashboard)
2. Test webhook: `curl -X POST https://citi-master.onrender.com/webhook`
3. Review Firebase data
4. Check Redis session state
5. Verify environment variables

---

## 📞 Support Contact Numbers

**Customer Support**: 1800-CITIMSTR (generic, not active)
**Test/Development**: +91-9999663120 (owner)
**Business WhatsApp**: +1 555 027 7084 (Meta test number)

---

## 🔐 Security Notes

1. **Never commit**:
   - .env file
   - API tokens
   - Firebase credentials
   - Personal phone numbers

2. **Token rotation**:
   - Current token valid until ~March 2, 2026
   - Set calendar reminder for February 25, 2026
   - Use System User tokens for production

3. **Access control**:
   - Dashboard requires HTTP Basic Auth
   - Render environment variables encrypted
   - Firebase security rules applied

---

## 📈 Metrics & KPIs

### Current Stats (as of Dec 6, 2025)
- **Total Customers**: Track in dashboard
- **Total Vendors**: Track in dashboard
- **Total Leads**: Track in dashboard
- **Revenue**: Track in dashboard
- **Callback Requests**: NEW - track via /api/callbacks

### Success Metrics
- Response time < 2 seconds
- Message delivery rate > 95%
- Customer completion rate > 60%
- Vendor onboarding conversion > 40%

---

## 🎓 Lessons Learned

1. **Token Management**: Always use permanent tokens for production, set expiry alerts
2. **Testing**: Whitelist test numbers before deployment
3. **State Management**: Proper conversation state tracking prevents flow breaks
4. **Error Handling**: Log all webhook errors for debugging
5. **Deployment**: Always trigger restart after env var changes
6. **Build Process**: Verify no duplicate imports after sed operations
7. **Documentation**: Keep PROJECT_MEMORY.md updated with every major change

---

## 🔄 Quick Reference Commands

```bash
# Navigate to project
cd ~/citi-master

# Check status
git status
npm run build

# Deploy
git add -A && git commit -m "Message" && git push

# Test webhook
curl -X POST https://citi-master.onrender.com/webhook \
  -H "Content-Type: application/json" \
  -d '{"object":"whatsapp_business_account","entry":[...]}'

# Check health
curl https://citi-master.onrender.com/health

# View logs
# Open: https://dashboard.render.com/web/srv-d4m1npe3jp1c739l56b0/logs

# Access dashboard
# Open: https://citi-master.onrender.com/dashboard
# Login: admin / citimaster2025
```

---

**END OF PROJECT MEMORY**

*This document serves as the single source of truth for CitiMaster project context. Update it with every major change, issue resolution, or feature addition.*
