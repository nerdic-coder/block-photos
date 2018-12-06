import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import {
  loadUserData,
  Person,
  signUserOut,
  isUserSignedIn
} from 'blockstack';

import packageJson from '../../package.json';
import AnalyticsService from '../services/AnalyticsService';
import CacheService from '../services/CacheService';
import PhotosService from '../services/PhotosService';
import PresentingService from '../services/PresentingService';

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
    this.photosService = new PhotosService();
    this.present = new PresentingService();
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

    AnalyticsService.logEvent('profile-page');
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

    AnalyticsService.logEvent('logged-out');
  }

  visitBlockstackProfile(e) {
    if (e) {
      e.preventDefault();
    }

    this.present.openLink("https://browser.blockstack.org/profiles", "_blank");

    AnalyticsService.logEvent('blockstack-profile-link');
  }

  reportIssue(e) {
    if (e) {
      e.preventDefault();
    }

    this.present.openLink("https://github.com/nerdic-coder/block-photos/issues/new", "_blank");

    AnalyticsService.logEvent('report-issue-link');
  }

  sendEmail() {
    this.present.openLink("mailto:johan@block-photos.com?subject=Block Photos Feedback");

    AnalyticsService.logEvent('send-email-link');
  }

  render() {
    const { person } = this.state;
    return (
      <React.Fragment>
        <ion-header>
          <ion-toolbar mode="md" color="primary">
            <ion-buttons slot="start">
              <Link to="/photos">
                <ion-button>
                  <ion-icon color="light" name="arrow-back"></ion-icon>
                </ion-button>
              </Link>
            </ion-buttons>
            <ion-title>Blockstack Profile</ion-title>
          </ion-toolbar>
        </ion-header>
        <ion-content class="profile">
          <ion-grid>
            <ion-row>
              <ion-col size="12" size-md="6" size-xl="4">
                <ion-card color="light" no-margin margin-horizontal>
                  <img src={person.avatarUrl() ? person.avatarUrl() : avatarFallbackImage} alt="Your profile avatar" />

                  <ion-card-header>
                    <ion-card-title>{person.name() ? person.name() : 'Nameless Person'}</ion-card-title>
                  </ion-card-header>
                  <ion-card-content>

                    <p>{person.description() ? person.description() : ''}</p>

                  </ion-card-content>
                </ion-card>
              </ion-col>
              <ion-col size="12" size-md="6" size-xl="8">
                <ion-button padding-horizontal expand="block"
                  id="signout-button"
                  onClick={(event) => this.handleSignOut(event)}
                >
                  Logout
                </ion-button>
                <ion-button padding-horizontal expand="block"
                  id="signout-button"
                  onClick={(event) => this.visitBlockstackProfile(event)}
                >
                  Go to profile on Blockstack
                </ion-button>

                <ion-button padding-horizontal expand="block"
                  id="signout-button"
                  onClick={() => this.sendEmail()}
                >
                  Email johan@block-photos.com
                </ion-button>

                <ion-button color="danger" padding-horizontal expand="block"
                  id="signout-button"
                  onClick={(event) => this.reportIssue(event)}
                >
                  Report issue
                </ion-button>
                <p text-center="true">Version {packageJson.version}</p>
              </ion-col>
            </ion-row>
          </ion-grid>
        </ion-content>
      </React.Fragment>
    );
  }

}
