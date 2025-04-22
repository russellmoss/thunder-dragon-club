const admin = require('firebase-admin');

// Initialize the admin SDK
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: 'thunder-dragon-club'
});

const db = admin.firestore();

async function createAdmin() {
  try {
    const adminUid = 'yNjiAUUotUcgcnCmo394ezlLWhz2'; // russell@mileaestatevineyard.com
    
    await db.collection('admins').doc(adminUid).set({
      email: 'russell@mileaestatevineyard.com',
      name: 'Russell',
      role: 'admin',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('Admin document created successfully!');
  } catch (error) {
    console.error('Error creating admin document:', error);
  }
}

createAdmin(); 