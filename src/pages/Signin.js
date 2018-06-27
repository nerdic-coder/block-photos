import React, { Component } from 'react';
import {
  generateAndStoreTransitKey,
  makeAuthRequest,
  redirectToSignInWithAuthRequest,
  DEFAULT_SCOPE,
  isUserSignedIn,
  isSignInPending,
  handlePendingSignIn
} from 'blockstack';

export default class Signin extends Component {

  constructor(props) {
    super(props);
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

  componentWillMount() {
    const { history } = this.props;
    if (isUserSignedIn()) {
      history.replace('/pictures');
    }
    else if (isSignInPending() && !isUserSignedIn()) {
      handlePendingSignIn().then(() => {
        history.replace('/pictures');
      });
    }
  }
}
