import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  generateAndStoreTransitKey,
  makeAuthRequest,
  redirectToSignInWithAuthRequest,
  DEFAULT_SCOPE,
  isUserSignedIn,
  isSignInPending,
  handlePendingSignIn,
  redirectToSignIn
} from 'blockstack';
import PresentingService from '../services/PresentingService';
import isElectron from 'is-electron';

export default class Signin extends Component {

  static propTypes = {
    history: PropTypes.any
  };

  state = {
    redirected: false
  };

  constructor(props) {
    super(props);

    const { history } = this.props;
    if (isUserSignedIn()) {
      if (history) {
        history.replace('/pictures');
      }
    } else if (isSignInPending() && !isUserSignedIn()) {
      handlePendingSignIn().then(() => {
        if (history) {
          history.replace('/pictures');
        }
      });
    }

    this.present = new PresentingService();
  }

  handleSignIn(e) {
    e.preventDefault();

    if (!isElectron()) {
      redirectToSignIn();
      this.setState({ redirected: true });
    } else {
      this.present.loading('Waiting for authentication...', 60000, true);
      let appDomain = 'http://localhost:9876';
      const transitPrivateKey = generateAndStoreTransitKey();
      const redirectURI = appDomain + '/callback';
      const manifestURI = appDomain + '/manifest.json';
      const scopes = DEFAULT_SCOPE;
      var authRequest = makeAuthRequest(transitPrivateKey, redirectURI, manifestURI, scopes, appDomain);
      redirectToSignInWithAuthRequest(authRequest);
    }
  }

  render() {
    const { redirected } = this.state;
    return (
      <React.Fragment>
        <ion-header>
          <ion-toolbar color="primary">
            <ion-title>Block Photos</ion-title>
          </ion-toolbar>
        </ion-header>
        <ion-content text-center class="signin">
          <h1>Welcome to Block Photos!</h1>
          <ion-img padding src="/favicon-1024x1024.png" />

          <ion-card color="light">
            <ion-card-content text-left>
              <p>To get started click the login button below</p> 
              <p>Blockstack will ask you to register an account if you don't have one already.</p>
              <p>Then all you need is to start adding photos with the '+' button or drag and drop them into the app view from your computers file browser.</p>
              {redirected ? ( <p>Thanks for logging in! You can close this window now.</p>) : 
                ( null )
              }
            </ion-card-content>
          </ion-card>
          {redirected ? ( null ) : (
            <ion-button padding-horizontal margin-bottom expand="block"
              id="signin-button"
              onClick={(event) => this.handleSignIn(event)}
            >
              Sign In with Blockstack
            </ion-button>
          )}
        </ion-content>
      </React.Fragment>
    );
  }

}
