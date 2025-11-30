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
      const data = doc.data();
      const status = data?.status || '';
      return ['PENDING', 'ASSIGNED', 'ACCEPTED'].includes(status);
    });

    const completedToday = leadsSnapshot.docs.filter(doc => {
      const data = doc.data();
      const updatedAt = data?.updatedAt || '';
      return data?.status === 'COMPLETED' && updatedAt >= todayStr;
    });

    const activeVendors = vendorsSnapshot.docs.filter(doc => {
      const data = doc.data();
      return data?.isActive === true;
    });

    return {
      totalMessages: messagesSnapshot.size || 0,
      activeLeads: activeLeads.length,
      completedToday: completedToday.length,
      activeVendors: activeVendors.length,
      revenueToday: 0,
      avgResponseTime: 2.3,
    };
  } catch (error) {
    console.error('Dashboard stats error:', error);
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
  try {
    const snapshot = await collections.leads
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        customerPhone: data?.customerPhone || data?.phoneNumber || 'N/A',
        service: `${data?.category || 'Unknown'} - ${data?.subcategory || ''}`,
        category: data?.category || 'Unknown',
        subcategory: data?.subcategory || '',
        status: data?.status || 'PENDING',
        address: data?.address?.area || data?.address?.city || 'N/A',
        createdAt: data?.createdAt || new Date().toISOString(),
      };
    });
  } catch (error) {
    console.error('Get recent leads error:', error);
    return [];
  }
}

export async function getRecentVendors(limit = 10) {
  try {
    const snapshot = await collections.vendors
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        phoneNumber: data?.phoneNumber || 'N/A',
        businessName: data?.businessName || 'Unknown',
        categories: data?.serviceCategories || [],
        isActive: data?.isActive || false,
        rating: data?.rating || 0,
        createdAt: data?.createdAt || new Date().toISOString(),
      };
    });
  } catch (error) {
    console.error('Get recent vendors error:', error);
    return [];
  }
}

export async function getActivityByDay() {
  try {
    const snapshot = await collections.leads
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();
    
    const byDay: Record<string, number> = {};
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const createdAt = data?.createdAt || new Date().toISOString();
      const date = new Date(createdAt).toISOString().split('T')[0];
      byDay[date] = (byDay[date] || 0) + 1;
    });
    
    return Object.entries(byDay)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([day, count]) => ({ day, count }));
  } catch (error) {
    console.error('Get activity by day error:', error);
    return [];
  }
}
