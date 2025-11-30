# Citi Master 🏘️

**WhatsApp-First Home Services Aggregator**

A production-ready platform for booking local services via WhatsApp, managed by senior professionals and serving everyone.

## 🌟 Features

- **WhatsApp Integration**: Full conversational booking flow via WhatsApp Cloud API
- **Smart Vendor Matching**: AI-powered algorithm matching customers with best-fit vendors
- **Bilingual Support**: English and Hindi (Hinglish) with automatic detection
- **Real-time Updates**: Redis-powered session management and instant notifications
- **Payment Integration**: Razorpay support with commission tracking
- **Admin Dashboard**: Vendor management, lead routing, analytics
- **Scalable Architecture**: PostgreSQL + Redis + Express + TypeScript

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- WhatsApp Business API access

### Installation

```bash
# Clone repository
git clone https://github.com/rajatagarwal14/citi-master.git
cd citi-master

# Install dependencies
npm install

# Setup environment
cp .env.sample .env
# Edit .env with your credentials

# Start infrastructure (Docker)
npm run docker:up

# Setup database
npm run db:push
npm run db:seed

# Start development server
npm run dev
```

### WhatsApp Setup

```bash
# Verify token and configure webhook
npm run whatsapp:setup

# Test message sending
npm run whatsapp:test +919999663120
```

## 📱 User Flow

1. Customer sends "Hi" to WhatsApp
2. Bot responds with service categories (AC, Cleaning, Plumbing, etc.)
3. Customer selects category → subcategory → provides address
4. Bot shows available slots with 3 nearby vendors
5. Customer confirms booking
6. Vendor receives assignment via WhatsApp
7. After service completion, customer provides rating

## 🏗️ Architecture

```
src/
├── index.ts                 # Express server + webhook handler
├── config/                  # Configuration & env validation
├── services/
│   ├── conversation.service.ts  # State machine
│   ├── matching.service.ts      # Vendor matching algorithm
│   ├── session.service.ts       # Redis session management
│   └── vendor.service.ts        # Vendor operations
├── utils/
│   ├── whatsapp-client.ts       # WhatsApp API wrapper
│   ├── whatsapp-parser.ts       # Message parsing
│   └── logger.ts                # Pino logger with PII masking
└── types/                   # TypeScript definitions

prisma/
├── schema.prisma           # Database models (9 tables)
└── seed.ts                 # Sample data

scripts/
├── setup-whatsapp.ts       # Automated WhatsApp setup
└── test-whatsapp.ts        # API testing
```

## 🗄️ Database Schema

- **Customer**: User profiles, preferences, language
- **Vendor**: Service providers with ratings and availability
- **Lead**: Customer requests with status tracking
- **Assignment**: Vendor assignments with acceptance tracking
- **MessageLog**: Complete WhatsApp conversation history
- **Payment**: Transaction records with commission
- **Issue**: Support tickets and complaints
- **FeaturedPlacement**: Promoted vendor listings
- **Coupon**: Discount codes

## 🔧 Configuration

Key environment variables:

```env
# WhatsApp
WHATSAPP_TOKEN=your_access_token
PHONE_NUMBER_ID=your_phone_number_id
VERIFY_TOKEN=your_webhook_verify_token

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/citi_master

# Redis
REDIS_URL=redis://localhost:6379

# Server
PORT=3000
NODE_ENV=production
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm test:watch

# Coverage report
npm test:coverage
```

## 📊 Vendor Matching Algorithm

Score = (0.35 × proximity) + (0.25 × rating) + (0.20 × price_fit) + (0.20 × accept_rate)

- **Proximity**: Distance from customer location
- **Rating**: Historical performance (1-5 stars)
- **Price Fit**: Alignment with customer budget
- **Accept Rate**: Vendor responsiveness

## 🌐 Webhook Setup

1. Start server: `npm run dev`
2. Expose via ngrok: `ngrok http 3000`
3. Set webhook URL in Meta Dashboard:
   - URL: `https://your-ngrok.app/webhook`
   - Verify Token: From `.env`
   - Subscribe to: `messages`

## 📈 Roadmap

- [ ] Multi-city expansion
- [ ] Voice message support
- [ ] Vendor mobile app
- [ ] Advanced analytics dashboard
- [ ] Subscription plans for frequent users
- [ ] AI-powered customer support

## 🤝 Contributing

This is a production project. For contributions, please contact the maintainer.

## 📄 License

MIT License - See LICENSE file for details

## 📞 Support

- Email: support@citimaster.in
- WhatsApp: +91 99996 63120
- Documentation: [docs/](./docs/)

---

**Built with ❤️ by senior professionals, for everyone**
