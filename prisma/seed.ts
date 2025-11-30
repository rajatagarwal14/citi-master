import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create sample vendors
  const vendors = await Promise.all([
    prisma.vendor.create({
      data: {
        phoneNumber: '919876543210',
        businessName: 'Cool Air AC Services',
        ownerName: 'Ramesh Kumar',
        categories: ['AC'],
        subcategories: ['AC_REPAIR', 'AC_INSTALLATION', 'AC_MAINTENANCE'],
        serviceAreas: ['110001', '110002', '110003'],
        location: {
          address: 'Connaught Place, New Delhi',
          coordinates: { lat: 28.6315, lng: 77.2167 }
        },
        rating: 4.5,
        totalRatings: 120,
        acceptanceRate: 0.85,
        priceRange: 'MEDIUM',
        availableSlots: {
          monday: [{ start: '09:00', end: '18:00' }],
          tuesday: [{ start: '09:00', end: '18:00' }],
          wednesday: [{ start: '09:00', end: '18:00' }],
          thursday: [{ start: '09:00', end: '18:00' }],
          friday: [{ start: '09:00', end: '18:00' }],
          saturday: [{ start: '10:00', end: '16:00' }]
        },
        isActive: true,
        isFeatured: true
      }
    }),
    prisma.vendor.create({
      data: {
        phoneNumber: '919876543211',
        businessName: 'SparkClean Services',
        ownerName: 'Priya Sharma',
        categories: ['CLEANING'],
        subcategories: ['DEEP_CLEANING', 'REGULAR_CLEANING', 'KITCHEN_CLEANING'],
        serviceAreas: ['110001', '110005', '110006'],
        location: {
          address: 'Karol Bagh, New Delhi',
          coordinates: { lat: 28.6519, lng: 77.1900 }
        },
        rating: 4.8,
        totalRatings: 95,
        acceptanceRate: 0.92,
        priceRange: 'HIGH',
        availableSlots: {
          monday: [{ start: '08:00', end: '20:00' }],
          tuesday: [{ start: '08:00', end: '20:00' }],
          wednesday: [{ start: '08:00', end: '20:00' }],
          thursday: [{ start: '08:00', end: '20:00' }],
          friday: [{ start: '08:00', end: '20:00' }],
          saturday: [{ start: '09:00', end: '18:00' }],
          sunday: [{ start: '09:00', end: '15:00' }]
        },
        isActive: true
      }
    }),
    prisma.vendor.create({
      data: {
        phoneNumber: '919876543212',
        businessName: 'QuickFix Plumbers',
        ownerName: 'Suresh Yadav',
        categories: ['PLUMBING'],
        subcategories: ['LEAK_REPAIR', 'PIPE_INSTALLATION', 'BATHROOM_FITTING'],
        serviceAreas: ['110002', '110003', '110004'],
        location: {
          address: 'Rohini, New Delhi',
          coordinates: { lat: 28.7041, lng: 77.1025 }
        },
        rating: 4.3,
        totalRatings: 78,
        acceptanceRate: 0.78,
        priceRange: 'LOW',
        availableSlots: {
          monday: [{ start: '07:00', end: '19:00' }],
          tuesday: [{ start: '07:00', end: '19:00' }],
          wednesday: [{ start: '07:00', end: '19:00' }],
          thursday: [{ start: '07:00', end: '19:00' }],
          friday: [{ start: '07:00', end: '19:00' }],
          saturday: [{ start: '08:00', end: '17:00' }],
          sunday: [{ start: '08:00', end: '14:00' }]
        },
        isActive: true
      }
    })
  ]);

  console.log(`✅ Created ${vendors.length} vendors`);

  // Create sample customer
  const customer = await prisma.customer.create({
    data: {
      phoneNumber: '919999663120',
      name: 'Test User',
      preferredLang: 'en',
      address: {
        street: 'Test Street',
        city: 'New Delhi',
        pincode: '110001',
        coordinates: { lat: 28.6139, lng: 77.2090 }
      }
    }
  });

  console.log(`✅ Created customer: ${customer.name}`);

  // Create sample coupons
  const coupons = await Promise.all([
    prisma.coupon.create({
      data: {
        code: 'FIRST50',
        discountType: 'PERCENTAGE',
        discountValue: 50,
        minOrderValue: 500,
        maxDiscount: 200,
        usageLimit: 1000,
        validFrom: new Date('2025-11-01'),
        validUntil: new Date('2025-12-31'),
        isActive: true
      }
    }),
    prisma.coupon.create({
      data: {
        code: 'WINTER100',
        discountType: 'FIXED',
        discountValue: 100,
        minOrderValue: 1000,
        usageLimit: 500,
        validFrom: new Date('2025-12-01'),
        validUntil: new Date('2026-01-31'),
        isActive: true
      }
    })
  ]);

  console.log(`✅ Created ${coupons.length} coupons`);

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
