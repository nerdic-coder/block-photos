import React, { Component } from 'react';
import { Route, Switch } from 'react-router';
import { ModalContainer } from 'react-router-modal';

import "@ionic/core/css/core.css";
import '@ionic/core/css/normalize.css';
import '@ionic/core/css/structure.css';
import '@ionic/core/css/typography.css';

import '@ionic/core/css/padding.css';
import '@ionic/core/css/float-elements.css';
import '@ionic/core/css/text-alignment.css';
import '@ionic/core/css/text-transformation.css';
import '@ionic/core/css/flex-utils.css';

import 'react-router-modal/css/react-router-modal.css';

import { Plugins } from '@capacitor/core';

import './App.css';
import PhotosList from './pages/PhotosList';
import Signin from './pages/Signin';
import Profile from './pages/Profile';
import Photo from './pages/Photo';

class MainApp extends Component {

  async componentDidMount() {
    const { Device, SplashScreen } = Plugins;

    const info = await Device.getInfo();
    if (info.platform !== 'web') {
      // Hide the splash (you should do this on app launch)
      SplashScreen.hide();
    }
  }
  
  render() {
    return (
      <ion-app>
        <Switch>
          <Route path="/profile" component={Profile} />
          <Route path="/photo/:id" component={Photo} />
          <Route path="/photos" component={PhotosList} />
          <Route path="/" component={Signin} />
        </Switch>
        <ion-alert-controller />
        <ion-action-sheet-controller />
        <ion-loading-controller/>
        <ion-toast-controller/>
        <ModalContainer outDelay="1000" />
      </ion-app>
    );
  }
}

export default MainApp;
