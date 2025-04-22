import { db } from './config';
import { collection } from 'firebase/firestore';

// Define collections
export const membersCollection = collection(db, 'members');
export const transactionsCollection = collection(db, 'transactions');
export const referralsCollection = collection(db, 'referrals');
export const redemptionsCollection = collection(db, 'redemptions');
export const configCollection = collection(db, 'config'); 