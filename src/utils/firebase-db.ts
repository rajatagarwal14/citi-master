import { collections } from './firebase';

export const firebaseDb = {
  // Customer operations
  async getCustomer(phoneNumber: string): Promise<any | null> {
    const snapshot = await collections.customers
      .where('phoneNumber', '==', phoneNumber)
      .limit(1)
      .get();
    
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  },

  async getCustomerById(id: string): Promise<any | null> {
    const doc = await collections.customers.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  },

  async createCustomer(data: any): Promise<any> {
    const docRef = await collections.customers.add({
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return { id: docRef.id, ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  },

  async updateCustomer(id: string, data: any): Promise<any> {
    await collections.customers.doc(id).update({
      ...data,
      updatedAt: new Date().toISOString(),
    });
    return { id, ...data };
  },

  // Vendor operations
  async getVendor(phoneNumber: string): Promise<any | null> {
    const snapshot = await collections.vendors
      .where('phoneNumber', '==', phoneNumber)
      .limit(1)
      .get();
    
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  },

  async createVendor(data: any): Promise<any> {
    const docRef = await collections.vendors.add({
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return { id: docRef.id, ...data };
  },

  // Lead operations
  async createLead(data: any): Promise<any> {
    const docRef = await collections.leads.add({
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return { id: docRef.id, ...data };
  },

  async getLead(id: string): Promise<any | null> {
    const doc = await collections.leads.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  },

  async updateLead(id: string, data: any): Promise<any> {
    await collections.leads.doc(id).update({
      ...data,
      updatedAt: new Date().toISOString(),
    });
    return { id, ...data };
  },

  // Assignment operations
  async createAssignment(data: any): Promise<any> {
    const docRef = await collections.assignments.add({
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return { id: docRef.id, ...data };
  },

  // Find available vendors
  async findAvailableVendors(serviceCategory: string, pincode: string): Promise<any[]> {
    const snapshot = await collections.vendors
      .where('serviceCategories', 'array-contains', serviceCategory)
      .where('servicePincodes', 'array-contains', pincode)
      .where('isAvailable', '==', true)
      .limit(5)
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  // Message logging
  async logMessage(data: any): Promise<void> {
    await collections.messages.add({
      ...data,
      createdAt: new Date().toISOString(),
    });
  },

  // Callback requests
  async createCallbackRequest(data: any): Promise<any> {
    const docRef = await collections.callbacks.add({
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return { id: docRef.id, ...data };
  },

  async getCallbackRequests(limit = 20): Promise<any[]> {
    const snapshot = await collections.callbacks
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async updateCallbackStatus(id: string, status: string): Promise<void> {
    await collections.callbacks.doc(id).update({
      status,
      updatedAt: new Date().toISOString(),
    });
  },
};
