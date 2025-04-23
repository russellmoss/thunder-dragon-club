const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Function to send a notification to a specific user
exports.sendNotificationToUser = functions.https.onCall(async (data, context) => {
  // Check if the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  // Check if the requester is an admin
  const adminRef = admin.firestore().collection('admins').doc(context.auth.uid);
  const adminDoc = await adminRef.get();
  
  if (!adminDoc.exists) {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can send notifications');
  }
  
  // Get the user's token
  const { userId, title, body, data: notificationData } = data;
  
  if (!userId || !title || !body) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters');
  }
  
  try {
    // Get the user's device tokens
    const deviceTokensSnapshot = await admin.firestore()
      .collection('deviceTokens')
      .where('userId', '==', userId)
      .get();
    
    if (deviceTokensSnapshot.empty) {
      throw new functions.https.HttpsError('not-found', 'No device tokens found for this user');
    }
    
    // Send notification to each device
    const tokens = deviceTokensSnapshot.docs.map(doc => doc.data().token);
    
    const message = {
      notification: {
        title,
        body,
      },
      data: notificationData || {},
      tokens,
    };
    
    const response = await admin.messaging().sendMulticast(message);
    
    // Log notification metadata
    await admin.firestore().collection('notifications').add({
      userId,
      title,
      body,
      data: notificationData,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      successCount: response.successCount,
      failureCount: response.failureCount
    });
    
    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount
    };
  } catch (error) {
    console.error('Error sending notification:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send notification');
  }
});

// Trigger notification when points are added
exports.notifyOnPointsAdded = functions.firestore
  .document('transactions/{transactionId}')
  .onCreate(async (snap, context) => {
    const transaction = snap.data();
    const { memberId, pointsEarned } = transaction;
    
    if (!memberId || !pointsEarned) return null;
    
    try {
      // Get the member details
      const memberRef = admin.firestore().collection('members').doc(memberId);
      const memberDoc = await memberRef.get();
      
      if (!memberDoc.exists) return null;
      
      const member = memberDoc.data();
      
      // Get the member's device tokens
      const deviceTokensSnapshot = await admin.firestore()
        .collection('deviceTokens')
        .where('userId', '==', memberId)
        .get();
      
      if (deviceTokensSnapshot.empty) return null;
      
      const tokens = deviceTokensSnapshot.docs.map(doc => doc.data().token);
      
      // Send notification
      const message = {
        notification: {
          title: 'Points Added!',
          body: `You've earned ${pointsEarned} points! Your new balance is ${member.points}.`,
        },
        data: {
          type: 'transaction',
          transactionId: context.params.transactionId,
          pointsEarned: pointsEarned.toString(),
          currentPoints: (member.points || 0).toString()
        },
        tokens,
      };
      
      return admin.messaging().sendMulticast(message);
    } catch (error) {
      console.error('Error sending points notification:', error);
      return null;
    }
  });

// Trigger notification for referral bonus
exports.notifyOnReferralBonus = functions.firestore
  .document('referrals/{referralId}')
  .onCreate(async (snap, context) => {
    const referral = snap.data();
    const { referrerId, referralBonus } = referral;
    
    if (!referrerId || !referralBonus) return null;
    
    try {
      // Get the referrer's device tokens
      const deviceTokensSnapshot = await admin.firestore()
        .collection('deviceTokens')
        .where('userId', '==', referrerId)
        .get();
      
      if (deviceTokensSnapshot.empty) return null;
      
      const tokens = deviceTokensSnapshot.docs.map(doc => doc.data().token);
      
      // Send notification
      const message = {
        notification: {
          title: 'Referral Bonus!',
          body: `You've earned ${referralBonus} points from a successful referral!`,
        },
        data: {
          type: 'referral',
          referralId: context.params.referralId,
          bonusPoints: referralBonus.toString()
        },
        tokens,
      };
      
      return admin.messaging().sendMulticast(message);
    } catch (error) {
      console.error('Error sending referral notification:', error);
      return null;
    }
  }); 