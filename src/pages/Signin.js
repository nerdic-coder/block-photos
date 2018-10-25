import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  generateAndStoreTransitKey,
  makeAuthRequest,
  redirectToSignInWithAuthRequest,
  DEFAULT_SCOPE,
  isUserSignedIn,
  isSignInPending,
  handlePendingSignIn
} from 'blockstack';
import PresentingService from '../services/PresentingService.js';
import isElectron from 'is-electron';

export default class Signin extends Component {

  static propTypes = {
    history: PropTypes.any
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
    this.present.loading('Waiting for authentication...', 60000, true);

    let appDomain = 'http://localhost:9876';
    if (!isElectron()) {
      appDomain = 'https://app.block-photos.com'
    }
    const transitPrivateKey = generateAndStoreTransitKey();
    const redirectURI = appDomain + '/callback';
    const manifestURI = appDomain + '/manifest.json';
    const scopes = DEFAULT_SCOPE;
    var authRequest = makeAuthRequest(transitPrivateKey, redirectURI, manifestURI, scopes, appDomain);
    redirectToSignInWithAuthRequest(authRequest);
  }

  render() {
    return (
      <React.Fragment>
        <ion-header>
          <ion-toolbar>
            <ion-title>Block Photos</ion-title>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <ion-card>
            <ion-card-content>
              <h1>Welcome to Block Photos!</h1>
              <ion-button expand="block"
                id="signin-button"
                onClick={(event) => this.handleSignIn(event)}
              >
                Sign In with Blockstack
          </ion-button>
            </ion-card-content>
          </ion-card>
        </ion-content>
      </React.Fragment>
    );
  }

}
