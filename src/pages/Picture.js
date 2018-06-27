import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { isUserSignedIn } from 'blockstack';

export default class PictureList extends Component {

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <React.Fragment>
        <ion-header>
          <ion-toolbar>
            <ion-buttons slot="start">
              <Link to="/pictures">
                <ion-back-button default-href="/pictures"></ion-back-button>
              </Link>
            </ion-buttons>
            <ion-title>Block Photo</ion-title>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <ion-img src="https://placekitten.com/400/400"></ion-img>
        </ion-content>
      </React.Fragment>
    );
  }

  componentWillMount() {
    if (!isUserSignedIn()) {
      const { history } = this.props;
      history.replace('/');
      return;
    }
  }

}
