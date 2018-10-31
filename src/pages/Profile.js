import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import {
  loadUserData,
  Person,
  signUserOut,
  isUserSignedIn
} from 'blockstack';

import CacheService from '../services/CacheService';
import PictureService from '../services/PictureService';
import PresentingService from '../services/PresentingService';
import UploadService from '../services/UploadService';

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

    this.cacheService = new CacheService();
    this.pictureService = new PictureService();
    this.present = new PresentingService();
    this.uploadService = new UploadService();
  }

  componentDidMount() {

    if (!isUserSignedIn() || !loadUserData()) {
      const { history } = this.props;
      if (history) {
        history.replace('/');
      }
      return;
    }

    this.uploadService.addEventListeners(false);
    this.setState({ person: new Person(loadUserData().profile) });
  }

  componentWillUnmount() {
    this.uploadService.removeEventListeners(false);
  }

  handleSignOut(e) {
    if (e) {
      e.preventDefault();
    }
    // Clear all the users cache in localStorage
    this.cacheService.clear();
    // End users Blockstack session
    signUserOut();
    const { history } = this.props;
    // Redirect to the login page
    if (history) {
      history.replace('/');
    }
  }

  visitBlockstackProfile(e) {
    if (e) {
      e.preventDefault();
    }

    window.open("https://browser.blockstack.org/profiles", "_blank");
  }

  reportIssue(e) {
    if (e) {
      e.preventDefault();
    }

    window.open("https://github.com/nerdic-coder/block-photos/issues/new", "_blank");
  }

  render() {
    const { person } = this.state;
    return (
      <React.Fragment>
        <ion-header>
          <ion-toolbar color="primary">
            <ion-buttons slot="start">
              <Link to="/pictures">
                <ion-button>
                  <ion-icon color="light" name="arrow-back"></ion-icon>
                </ion-button>
              </Link>
            </ion-buttons>
            <ion-title>Blockstack Profile</ion-title>
          </ion-toolbar>
        </ion-header>
        <ion-content color="medium">
          <ion-card color="light">
            <img src={person.avatarUrl() ? person.avatarUrl() : avatarFallbackImage} />

            <ion-card-header>
              <ion-card-title>{person.name() ? person.name() : 'Nameless Person'}</ion-card-title>
            </ion-card-header>
            <ion-card-content>

              <p>{person.description() ? person.description() : ''}</p>

            </ion-card-content>
          </ion-card>
          <ion-button padding-horizontal expand="block"
            id="signout-button"
            onClick={(event) => this.visitBlockstackProfile(event)}
          >
            Go to profile on Blockstack
          </ion-button>
          <ion-button padding-horizontal expand="block"
            id="signout-button"
            onClick={(event) => this.handleSignOut(event)}
          >
            Logout
          </ion-button>

          <ion-button color="danger" padding-horizontal expand="block"
            id="signout-button"
            onClick={(event) => this.reportIssue(event)}
          >
            Report issue
          </ion-button>
        </ion-content>
      </React.Fragment>
    );
  }

}
