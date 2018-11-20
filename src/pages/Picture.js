import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { isUserSignedIn } from 'blockstack';

import PictureService from '../services/PictureService';
import PresentingService from '../services/PresentingService';
import BlockImg from '../components/BlockImg';
import UploadService from '../services/UploadService';

export default class PicturesList extends Component {

  _isMounted = false;

  static propTypes = {
    history: PropTypes.any,
    match: PropTypes.any
  };

  state = {
    nextAndPreviousPicture: [],
    currentId: this.props.match.params.id
  };

  constructor(props) {
    super(props);

    this.pictureService = new PictureService();
    this.present = new PresentingService();
    this.uploadService = new UploadService();

    const { history } = this.props;
    // Go to signin page if no active session exist
    if (!isUserSignedIn()) {
      if (history) {
        history.replace('/');
      }
      return;
    }

    const { match } = this.props;

    // Go to pictures list if picture id is missing
    if (!match || !match.params || !match.params.id) {
      if (history) {
        history.replace('/pictures');
      }
      return;
    }

  }

  componentDidMount() {
    this._isMounted = true;

    this.uploadService.addEventListeners(false);
    this.loadPictureWithId(this.props.match.params.id);

    if (window.gtag) {
      window.gtag('event', 'picture-page');
    }
  }

  componentWillUnmount() {
    this._isMounted = false;

    this.uploadService.removeEventListeners(false);
  }

  async loadPictureWithId(id) {
    if (id && this._isMounted) {
      const nextAndPreviousPicture = await this.pictureService.getNextAndPreviousPicture(id);
      this.setState({ nextAndPreviousPicture: nextAndPreviousPicture, currentId: id });
    }
  }

  async rotatePicture(currentId) {
    await this.pictureService.rotatePicture(currentId);

    if (this._isMounted) {
      this.setState({ nextAndPreviousPicture: this.state.nextAndPreviousPicture, currentId: 'loading' });
      this.loadPictureWithId(currentId);
    }

    if (window.gtag) {
      window.gtag('event', 'picture-page-rotate');
    }
  }

  deletePictureCallback(callbackComponent) {
    const { history } = callbackComponent.props;
    history.replace('/pictures');

    if (window.gtag) {
      window.gtag('event', 'picture-page-delete');
    }
  }

  render() {
    const { currentId, nextAndPreviousPicture } = this.state;
    if (!currentId) {
      return (<h1>404 - Picture not found</h1>);
    }
    return (
      <React.Fragment>
        <ion-header>
          <ion-toolbar color="primary">
            <ion-buttons slot="start">
              <Link to="/pictures">
                <ion-button>
                  <ion-icon color="light" name="close" size="large"></ion-icon>
                </ion-button>
              </Link>
            </ion-buttons>
            <ion-title>Photo</ion-title>
            <ion-buttons slot="end">
              <ion-button onClick={() => this.rotatePicture(currentId)}>
                <ion-icon color="light" name="sync"></ion-icon>
              </ion-button>
              <ion-button onClick={() => this.present.deletePicture(currentId, this)}>
                <ion-icon color="light" name="trash"></ion-icon>
              </ion-button>
              <ion-button disabled={!nextAndPreviousPicture.previousId} onClick={() => this.loadPictureWithId(nextAndPreviousPicture.previousId)}>
                <ion-icon color="light" name="arrow-back"></ion-icon>
              </ion-button>
              <ion-button disabled={!nextAndPreviousPicture.nextId} onClick={() => this.loadPictureWithId(nextAndPreviousPicture.nextId)}>
                <ion-icon color="light" name="arrow-forward"></ion-icon>
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>

        <ion-content text-center class="picture-page">
          <BlockImg id={currentId} rotate={true} />
        </ion-content>
      </React.Fragment>
    );
  }

}
