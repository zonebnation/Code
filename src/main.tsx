import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';
import './styles/responsive.css';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

// Initialize Capacitor plugins if on a native platform
if (Capacitor.isNativePlatform()) {
  // Hide the splash screen with a fade
  SplashScreen.hide({
    fadeOutDuration: 500
  });
  
  // Set status bar style
  StatusBar.setStyle({ style: Style.Dark });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);