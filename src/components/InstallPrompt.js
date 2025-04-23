import React, { useState, useEffect } from 'react';

const InstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptType, setPromptType] = useState(null);
  const [installEvent, setInstallEvent] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  
  useEffect(() => {
    // Check if the app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator.standalone === true);
    
    // Check if the user has previously dismissed the prompt
    const hasUserDismissed = localStorage.getItem('installPromptDismissed');
    
    if (isStandalone || hasUserDismissed) {
      setShowPrompt(false);
      return;
    }
    
    // Detect browser/device type
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isAndroid = /Android/.test(navigator.userAgent);
    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    
    if (isIOS) {
      setPromptType('ios');
      setShowPrompt(true);
    } else if (isAndroid && isChrome) {
      setPromptType('android');
      
      // Listen for beforeinstallprompt event
      const handleBeforeInstallPrompt = (e) => {
        // Prevent the default prompt
        e.preventDefault();
        // Store the event for later use
        setInstallEvent(e);
        setShowPrompt(true);
      };
      
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      
      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }
  }, []);
  
  const handleInstall = async () => {
    if (promptType === 'android' && installEvent) {
      // Show the install prompt
      installEvent.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await installEvent.userChoice;
      
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
    }
  };
  
  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('installPromptDismissed', 'true');
  };
  
  if (!showPrompt) return null;
  
  return (
    <div className="install-prompt">
      <div className="install-prompt-content">
        <div className="install-prompt-header">
          <h3>Install the Thunder Dragon Club App</h3>
          <button className="dismiss-button" onClick={handleDismiss}>×</button>
        </div>
        
        {promptType === 'ios' && (
          <div className="ios-instructions">
            <p>Install this app on your device:</p>
            <ol>
              <li>Tap the <strong>Share</strong> icon <span className="ios-share-icon">⎙</span> in the browser toolbar</li>
              <li>Scroll down and tap <strong>Add to Home Screen</strong></li>
              <li>Tap <strong>Add</strong> to confirm</li>
            </ol>
            <div className="ios-illustration">
              <div className="ios-share"></div>
              <div className="ios-arrow"></div>
              <div className="ios-home-screen"></div>
            </div>
          </div>
        )}
        
        {promptType === 'android' && (
          <div className="android-instructions">
            <p>Install this app on your device for easier access:</p>
            <button className="install-button" onClick={handleInstall}>
              Install App
            </button>
          </div>
        )}
      </div>
      
      <style jsx>{`
        .install-prompt {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background-color: var(--background-color);
          box-shadow: 0 -4px 10px rgba(0, 0, 0, 0.2);
          z-index: 1000;
          padding: 20px;
          animation: slideUp 0.3s ease-out;
        }
        
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        
        .install-prompt-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        
        .install-prompt-header h3 {
          margin: 0;
          color: var(--header-color);
        }
        
        .dismiss-button {
          background: none;
          border: none;
          color: var(--text-color);
          font-size: 24px;
          cursor: pointer;
        }
        
        .ios-instructions, .android-instructions {
          color: var(--text-color);
        }
        
        .ios-instructions ol {
          padding-left: 20px;
          margin: 15px 0;
        }
        
        .ios-instructions li {
          margin-bottom: 10px;
        }
        
        .ios-share-icon {
          display: inline-block;
          font-size: 1.2em;
          vertical-align: middle;
        }
        
        .install-button {
          background-color: var(--accent-color);
          color: #000000;
          border: none;
          border-radius: 4px;
          padding: 12px 24px;
          font-size: 1rem;
          font-weight: bold;
          cursor: pointer;
          margin-top: 10px;
          width: 100%;
        }
        
        .ios-illustration {
          display: flex;
          align-items: center;
          justify-content: space-around;
          margin-top: 20px;
          margin-bottom: 10px;
        }
        
        .ios-share {
          width: 60px;
          height: 80px;
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          position: relative;
        }
        
        .ios-share:after {
          content: "⎙";
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 1.5rem;
        }
        
        .ios-arrow {
          width: 40px;
          height: 20px;
          position: relative;
        }
        
        .ios-arrow:after {
          content: "";
          position: absolute;
          width: 100%;
          height: 2px;
          background-color: var(--text-color);
          top: 50%;
          left: 0;
        }
        
        .ios-arrow:before {
          content: "";
          position: absolute;
          width: 10px;
          height: 10px;
          border-top: 2px solid var(--text-color);
          border-right: 2px solid var(--text-color);
          transform: rotate(45deg);
          right: 0;
          top: 5px;
        }
        
        .ios-home-screen {
          width: 60px;
          height: 80px;
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          position: relative;
        }
        
        .ios-home-screen:after {
          content: "+";
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 1.5rem;
        }
      `}</style>
    </div>
  );
};

export default InstallPrompt; 