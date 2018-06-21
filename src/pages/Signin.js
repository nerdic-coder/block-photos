import React, { Component } from 'react';

export default class Signin extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { handleSignIn } = this.props;

    return (
      <ion-card>
        <ion-card-content>
          <h1>Welcome to React Photos!</h1>
          <ion-button expand="block"
            id="signin-button"
            onClick={handleSignIn.bind(this)}
          >
            Sign In with Blockstack
          </ion-button>
        </ion-card-content>
      </ion-card>
    );
  }
}
