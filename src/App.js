import React, { Component } from 'react';
import { Route, Switch } from 'react-router';

import './App.css';
import PicturesList from './pages/PicturesList.js';
import Signin from './pages/Signin.js';
import Profile from './pages/Profile.js';
import Picture from './pages/Picture.js';

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
        <ion-loading-controller/>
        <ion-toast-controller/>
      </ion-app>
    );
  }
}

export default App;
