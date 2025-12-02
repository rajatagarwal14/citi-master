import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : undefined;

  admin.initializeApp({
    credential: serviceAccount 
      ? admin.credential.cert(serviceAccount)
      : admin.credential.applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID || 'citi-master',
  });
}

export const db = getFirestore();
export const firebase = admin;

export const collections = {
  customers: db.collection('customers'),
  vendors: db.collection('vendors'),
  leads: db.collection('leads'),
  assignments: db.collection('assignments'),
  messages: db.collection('messages'),
  payments: db.collection('payments'),
  issues: db.collection('issues'),
  callbacks: db.collection('callbacks'),
};
