import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase/config';
import { collection, getDocs } from 'firebase/firestore';

const FirebaseTest = () => {
  const [status, setStatus] = useState('Checking connection...');
  const [error, setError] = useState(null);
  const [collections, setCollections] = useState([]);

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test Firestore connection
        const collectionsSnapshot = await getDocs(collection(db, 'members'));
        setCollections(collectionsSnapshot.docs.map(doc => doc.id));
        
        // Test Auth connection
        const currentUser = auth.currentUser;
        
        setStatus('Connected successfully!');
        setError(null);
      } catch (err) {
        setStatus('Connection failed');
        setError(err.message);
        console.error('Firebase connection error:', err);
      }
    };

    testConnection();
  }, []);

  return (
    <div style={{ 
      padding: '20px', 
      margin: '20px', 
      border: '1px solid #ccc',
      borderRadius: '8px'
    }}>
      <h2>Firebase Connection Test</h2>
      <div style={{ margin: '10px 0' }}>
        <strong>Status:</strong> {status}
      </div>
      {error && (
        <div style={{ 
          color: 'red', 
          margin: '10px 0',
          padding: '10px',
          backgroundColor: '#ffebee',
          borderRadius: '4px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      {collections.length > 0 && (
        <div style={{ margin: '10px 0' }}>
          <strong>Collections found:</strong>
          <ul>
            {collections.map((collection, index) => (
              <li key={index}>{collection}</li>
            ))}
          </ul>
        </div>
      )}
      <div style={{ margin: '10px 0' }}>
        <strong>Environment Variables:</strong>
        <pre style={{ 
          backgroundColor: '#f5f5f5', 
          padding: '10px',
          borderRadius: '4px',
          overflow: 'auto'
        }}>
          {JSON.stringify({
            apiKey: process.env.REACT_APP_FIREBASE_API_KEY ? 'Set' : 'Not Set',
            authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN ? 'Set' : 'Not Set',
            projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID ? 'Set' : 'Not Set',
            storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET ? 'Set' : 'Not Set',
            messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID ? 'Set' : 'Not Set',
            appId: process.env.REACT_APP_FIREBASE_APP_ID ? 'Set' : 'Not Set'
          }, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default FirebaseTest; 