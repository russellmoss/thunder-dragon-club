import React, { useState, useEffect } from 'react';
import { Button } from '@mui/material';
import { Download, PhoneAndroid, PhoneIphone } from '@mui/icons-material';

const InstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Update UI to notify the user they can install the PWA
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    // We no longer need the prompt. Clear it up
    setDeferredPrompt(null);
    setIsInstallable(false);

    // Optionally, send analytics event with outcome
    console.log(`User response to the install prompt: ${outcome}`);
  };

  // Don't show the button if the app is already installed or not installable
  if (!isInstallable) {
    return null;
  }

  return (
    <Button
      variant="contained"
      color="primary"
      startIcon={<Download />}
      onClick={handleInstallClick}
      sx={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 1000,
        boxShadow: 3,
        '&:hover': {
          boxShadow: 6,
        },
      }}
    >
      Install App
    </Button>
  );
};

export default InstallButton; 