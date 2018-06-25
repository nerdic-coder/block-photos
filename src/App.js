import React, { Component } from 'react';
import { Route, Switch } from 'react-router';

import './App.css';
import PictureList from './pages/PictureList.js';
import Signin from './pages/Signin.js';
import Profile from './pages/Profile.js';

class App extends Component {

  render() {
    return (
      <ion-app>
        <Switch>
          <Route path="/profile" component={Profile} />
          <Route path="/pictures" component={PictureList} />
          <Route path="/" component={Signin} />
        </Switch>
      </ion-app>
    );
  }
}

export default App;
