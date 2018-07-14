import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import {
  loadUserData,
  Person,
  signUserOut,
  isUserSignedIn
} from 'blockstack';

import StorageService from '../services/StorageService';

const avatarFallbackImage = 'https://s3.amazonaws.com/onename/avatar-placeholder.png';

export default class Profile extends Component {

  static propTypes = {
    history: PropTypes.any
  };

  state = {
    person: new Person({ avatarUrl: avatarFallbackImage, name: 'Nameless Person' })
  };

  constructor(props) {
    super(props);

    this.storageService = new StorageService();
  }

  componentDidMount() {

    if (!isUserSignedIn() || !loadUserData()) {
      const { history } = this.props;
      if (history) {
        history.replace('/');
      }
      return;
    }

    this.setState({ person: new Person(loadUserData().profile) });
  }

  handleSignOut(e) {
    if (e) {
      e.preventDefault();
    }
    // Clear all the users cache in localStorage
    this.storageService.clear();
    // End users Blockstack session
    signUserOut();
    const { history } = this.props;
    // Redirect to the login page
    if (history) {
      history.replace('/');
    }
  }

  render() {
    const { person } = this.state;
    return (
      <React.Fragment>
        <ion-header>
          <ion-toolbar>
            <ion-buttons slot="start">
              <Link to="/pictures">
                <ion-back-button default-href="/pictures"></ion-back-button>
              </Link>
            </ion-buttons>
            <ion-title>Blockstack Profile</ion-title>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <ion-card>
            <img src={person.avatarUrl() ? person.avatarUrl() : avatarFallbackImage} />

            <ion-card-content>
              <ion-card-title>You are {person.name() ? person.name() : 'Nameless Person'}!</ion-card-title>
              <p>
                <ion-button expand="block"
                  id="signout-button"
                  onClick={(event) => this.handleSignOut(event)}
                >
                  Logout
            </ion-button>
              </p>
            </ion-card-content>
          </ion-card>
        </ion-content>
      </React.Fragment>
    );
  }

}
