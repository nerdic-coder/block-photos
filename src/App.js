import React, { Component } from 'react';

import {
  isSignInPending,
  isUserSignedIn,
  redirectToSignIn,
  handlePendingSignIn,
  signUserOut,
  generateAndStoreTransitKey,
  makeAuthRequest,
  redirectToSignInWithAuthRequest,
  DEFAULT_SCOPE
} from 'blockstack';

import './App.css';
import Profile from './pages/Profile.js';
import Signin from './pages/Signin.js';

class App extends Component {

  handleSignIn(e) {
    e.preventDefault();
    // redirectToSignIn();
    const transitPrivateKey = generateAndStoreTransitKey();
    const redirectURI = 'http://localhost:9876/callback';
    const manifestURI = 'http://localhost:9876/manifest.json';
    const scopes = DEFAULT_SCOPE;
    const appDomain = 'http://localhost:9876';
    var authRequest = makeAuthRequest(transitPrivateKey, redirectURI, manifestURI, scopes, appDomain);
    redirectToSignInWithAuthRequest(authRequest);
  }

  handleSignOut(e) {
    e.preventDefault();
    signUserOut(window.location.origin);
  }

  render() {
    return (
      <ion-app>
        <ion-header>
          <ion-toolbar>
            <ion-title>React Photos</ion-title>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          {!isUserSignedIn() ?
            <Signin handleSignIn={this.handleSignIn} />
            : <Profile handleSignOut={this.handleSignOut} />
          }
        </ion-content>
      </ion-app>
    );
  }

  componentWillMount() {
    if (isSignInPending()) {
      handlePendingSignIn().then((userData) => {
        window.location = window.location.origin;
      });
    }
  }

}

export default App;
