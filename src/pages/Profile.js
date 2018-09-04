import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import {
  loadUserData,
  Person,
  signUserOut,
  isUserSignedIn
} from 'blockstack';
import { ipcRenderer } from 'electron';
import isElectron from 'is-electron';

import CacheService from '../services/CacheService';
import PictureService from '../services/PictureService.js';
import PresentingService from '../services/PresentingService.js';

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
  }

  componentDidMount() {

    if (!isUserSignedIn() || !loadUserData()) {
      const { history } = this.props;
      if (history) {
        history.replace('/');
      }
      return;
    }

    if (isElectron()) {
      ipcRenderer.on('upload-files', this.uploadFiles.bind(this));
    }

    this.setState({ person: new Person(loadUserData().profile) });
  }

  componentWillUnmount() {
    if (isElectron()) {
      ipcRenderer.removeAllListeners('upload-files');
    }
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

  async uploadFiles(event, filesData) {
    if (filesData && filesData.length > 0) {
      this.present.loading('Pictures uploading...');
      const response = await this.pictureService.uploadPictures(filesData);
      this.present.dismissLoading();
      if (response.errorsList && response.errorsList.length > 0) {
        for (let error of response.errorsList) {
          if (error.errorCode === 'err_filesize') {
            this.present.toast('Failed to upload "' + error.id + '", picture exceeds file size limit of 5MB.');
          } else {
            this.present.toast('Failed to upload "' + error.id + '".');
          }
        }
      }
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
