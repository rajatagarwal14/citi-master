import { collections } from '../utils/firebase';

export async function getDashboardStats() {
  try {
    const [messagesSnapshot, leadsSnapshot, vendorsSnapshot] = await Promise.all([
      collections.messages.get(),
      collections.leads.get(),
      collections.vendors.get(),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();

    const activeLeads = leadsSnapshot.docs.filter(doc => {
      const status = doc.data().status;
      return ['PENDING', 'ASSIGNED', 'ACCEPTED'].includes(status);
    });

    const completedToday = leadsSnapshot.docs.filter(doc => {
      const data = doc.data();
      return data.status === 'COMPLETED' && data.updatedAt >= todayStr;
    });

    return {
      totalMessages: messagesSnapshot.size,
      activeLeads: activeLeads.length,
      completedToday: completedToday.length,
      activeVendors: vendorsSnapshot.docs.filter(doc => doc.data().isActive).length,
      revenueToday: 0, // TODO: Calculate from payments
      avgResponseTime: 2.3,
    };
  } catch (error) {
    return {
      totalMessages: 0,
      activeLeads: 0,
      completedToday: 0,
      activeVendors: 0,
      revenueToday: 0,
      avgResponseTime: 0,
    };
  }
}

export async function getRecentLeads(limit = 10) {
  const snapshot = await collections.leads
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      customerPhone: data.customerPhone || data.phoneNumber,
      service: data.service,
      category: data.category,
      status: data.status,
      createdAt: data.createdAt,
    };
  });
}

export async function getRecentVendors(limit = 10) {
  const snapshot = await collections.vendors
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      phoneNumber: data.phoneNumber,
      businessName: data.businessName,
      categories: data.serviceCategories || [],
      isActive: data.isActive,
      rating: data.rating || 0,
    };
  });
}

export async function getActivityByDay() {
  const snapshot = await collections.leads
    .orderBy('createdAt', 'desc')
    .limit(100)
    .get();
  
  const byDay: Record<string, number> = {};
  
  snapshot.docs.forEach(doc => {
    const date = new Date(doc.data().createdAt).toISOString().split('T')[0];
    byDay[date] = (byDay[date] || 0) + 1;
  });
  
  return Object.entries(byDay).map(([day, count]) => ({ day, count }));
}
