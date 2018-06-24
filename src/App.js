import React, { Component } from 'react';

import {
  isSignInPending,
  isUserSignedIn,
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

  constructor() {
    super();
    this.isSignedIn = isUserSignedIn();
  }

  handleSignIn(e) {
    e.preventDefault();
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
    signUserOut();
    this.isSignedIn = false;
    window.location = window.location.pathname;
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
          {!this.isSignedIn ?
            <Signin handleSignIn={this.handleSignIn} />
            : <Profile handleSignOut={this.handleSignOut} />
          }
        </ion-content>
      </ion-app>
    );
  }

  componentWillMount() {
    this.isSignedIn = isUserSignedIn();
    if (isSignInPending() && !this.isSignedIn) {
      handlePendingSignIn().then(() => {
        window.location = window.location.pathname;
      });
    }
  }

}

export default App;
