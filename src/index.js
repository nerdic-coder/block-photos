import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { Plugins, StatusBarStyle } from '@capacitor/core';

const { Device } = Plugins;

import './index.css';
import MainApp from './MainApp';

// import registerServiceWorker from './registerServiceWorker';
ReactDOM.render(
  <BrowserRouter>
    <MainApp />
  </BrowserRouter>,
  document.getElementById('root'));

// registerServiceWorker();

async function initCapacitor() {
  const info = await Device.getInfo();
  if (info.platform !== 'web') {
    const { App, StatusBar } = Plugins;
    StatusBar.setStyle(StatusBarStyle.Light);
    StatusBar.setBackgroundColor({ color: '#220631'});

    App.addListener('appUrlOpen', (data) => {
      if (data.url) {
        let authResponse = data.url.split(":")[1];
        if (authResponse) {
          window.location = window.location + '?authResponse=' + authResponse;
        }
      }
    });
  }
}

initCapacitor();
