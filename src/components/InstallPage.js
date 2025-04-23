import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  Button
} from '@mui/material';
import { 
  PhoneAndroid, 
  PhoneIphone, 
  DesktopWindows,
  Download,
  AddToHomeScreen,
  Share
} from '@mui/icons-material';

const InstallPage = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
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

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, margin: '0 auto' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Install Thunder Dragon Club App
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Why Install the App?
        </Typography>
        <List>
          <ListItem>
            <ListItemIcon>
              <AddToHomeScreen />
            </ListItemIcon>
            <ListItemText 
              primary="Quick Access" 
              secondary="Get instant access to your loyalty points and rewards" 
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <Download />
            </ListItemIcon>
            <ListItemText 
              primary="Offline Access" 
              secondary="View your points and history even without internet" 
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <Share />
            </ListItemIcon>
            <ListItemText 
              primary="Push Notifications" 
              secondary="Get notified about special offers and points updates" 
            />
          </ListItem>
        </List>
      </Paper>

      {isInstallable && (
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<Download />}
            onClick={handleInstallClick}
            sx={{ py: 2, px: 4 }}
          >
            Install App Now
          </Button>
        </Box>
      )}

      <Grid container spacing={3}>
        {/* Android Instructions */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PhoneAndroid sx={{ mr: 1 }} />
              <Typography variant="h6">Android</Typography>
            </Box>
            <List>
              <ListItem>
                <ListItemText 
                  primary="1. Open Chrome browser"
                  secondary="Make sure you're using Chrome on your Android device"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="2. Tap the menu button"
                  secondary="Look for the three dots in the top-right corner"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="3. Select 'Add to Home screen'"
                  secondary="This will install the app on your device"
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* iOS Instructions */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PhoneIphone sx={{ mr: 1 }} />
              <Typography variant="h6">iPhone/iPad</Typography>
            </Box>
            <List>
              <ListItem>
                <ListItemText 
                  primary="1. Open Safari browser"
                  secondary="Make sure you're using Safari on your iOS device"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="2. Tap the share button"
                  secondary="Look for the square with an arrow pointing up"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="3. Select 'Add to Home Screen'"
                  secondary="This will install the app on your device"
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Desktop Instructions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <DesktopWindows sx={{ mr: 1 }} />
              <Typography variant="h6">Desktop</Typography>
            </Box>
            <Typography variant="body1" paragraph>
              For the best experience, we recommend using the app on your mobile device.
              However, you can still access all features through your desktop browser.
            </Typography>
            {isInstallable && (
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={handleInstallClick}
                sx={{ mt: 2 }}
              >
                Install for Desktop
              </Button>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Having trouble installing? Contact support for assistance.
        </Typography>
      </Box>
    </Box>
  );
};

export default InstallPage; 