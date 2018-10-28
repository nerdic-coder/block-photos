import React, { Component } from 'react';
import { Route, Switch } from 'react-router';

import "@ionic/core/css/core.css";
import '@ionic/core/css/normalize.css';
import '@ionic/core/css/structure.css';
import '@ionic/core/css/typography.css';

import '@ionic/core/css/padding.css';
import '@ionic/core/css/float-elements.css';
import '@ionic/core/css/text-alignment.css';
import '@ionic/core/css/text-transformation.css';
import '@ionic/core/css/flex-utils.css';

import './App.css';
import PicturesList from './pages/PicturesList';
import Signin from './pages/Signin';
import Profile from './pages/Profile';
import Picture from './pages/Picture';

class App extends Component {

  render() {
    return (
      <ion-app>
        <Switch>
          <Route path="/profile" component={Profile} />
          <Route path="/picture/:id" component={Picture} />
          <Route path="/pictures" component={PicturesList} />
          <Route path="/" component={Signin} />
        </Switch>
        <ion-alert-controller />
        <ion-action-sheet-controller />
        <ion-loading-controller/>
        <ion-toast-controller/>
      </ion-app>
    );
  }
}

export default App;
