import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { isUserSignedIn } from 'blockstack';

import PhotosService from '../services/PhotosService';
import PresentingService from '../services/PresentingService';
import BlockImg from '../components/BlockImg';

export default class PhotosList extends Component {

  _isMounted = false;

  static propTypes = {
    history: PropTypes.any,
    match: PropTypes.any,
    updateCallback: PropTypes.func
  };

  state = {
    nextAndPreviousPhoto: [],
    currentId: this.props.match.params.id
  };

  constructor(props) {
    super(props);

    this.photosService = new PhotosService();
    this.present = new PresentingService();

    const { history } = this.props;
    // Go to signin page if no active session exist
    if (!isUserSignedIn()) {
      if (history) {
        history.replace('/');
      }
      return;
    }

    const { match } = this.props;

    // Go to photos list if photo id is missing
    if (!match || !match.params || !match.params.id) {
      if (history) {
        history.replace('/photos');
      }
      return;
    }

  }

  componentDidMount() {
    this._isMounted = true;

    this.loadPhotoWithId(this.props.match.params.id);

    if (window.gtag) {
      window.gtag('event', 'photo-page');
    }
  }

  componentDidUpdate(prevProps) {
    if (this._isMounted && this.props.match.params.id !== prevProps.match.params.id) {
      this.loadPhotoWithId(this.props.match.params.id);
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  async loadPhotoWithId(id) {
    if (id && this._isMounted) {
      const nextAndPreviousPhoto = await this.photosService.getNextAndPreviousPhoto(id);
      if (this._isMounted) {
        this.setState({ nextAndPreviousPhoto: nextAndPreviousPhoto, currentId: id });
      }
    }
  }

  gotoPhotoWithId(id) {
    if (id) {
      const { history } = this.props;
      if (history) {
        history.replace("/photos/photo/" + id);
      }
    }
  }

  async rotatePhoto(currentId) {
    await this.photosService.rotatePhoto(currentId);
    
    const { updateCallback } = this.props;

    if (this._isMounted) {
      this.setState({ nextAndPreviousPhoto: this.state.nextAndPreviousPhoto, currentId: 'loading' });
      this.loadPhotoWithId(currentId);
    }

    if (updateCallback && typeof (updateCallback) === "function") {
      // execute the callback, passing parameters as necessary
      updateCallback(currentId);
    }

    if (window.gtag) {
      window.gtag('event', 'photo-page-rotate');
    }
  }

  deletePhotoCallback(callbackComponent) {
    const { history, updateCallback } = callbackComponent.props;

    if (updateCallback && typeof (updateCallback) === "function") {
      // execute the callback, passing parameters as necessary
      updateCallback();
    }

    if (this.state.nextAndPreviousPhoto && this.state.nextAndPreviousPhoto.nextId) {
      this.gotoPhotoWithId(this.state.nextAndPreviousPhoto.nextId);
    }
    else if(this.state.nextAndPreviousPhoto && this.state.nextAndPreviousPhoto.previousId) {
      this.gotoPhotoWithId(this.state.nextAndPreviousPhoto.previousId);
    }
    else if (history) {
      setTimeout(() => {
        history.replace('/photos');
      }, 2000);
    }

    if (window.gtag) {
      window.gtag('event', 'photo-page-delete');
    }
  }

  render() {
    const { currentId, nextAndPreviousPhoto } = this.state;
    if (!currentId) {
      return (<h1>404 - Photo not found</h1>);
    }
    return (
      <React.Fragment>
        <ion-header>
          <ion-toolbar color="primary">
            <ion-buttons slot="start">
              <Link to="/photos">
                <ion-button>
                  <ion-icon color="light" name="close" size="large"></ion-icon>
                </ion-button>
              </Link>
            </ion-buttons>
            <ion-title>Photo</ion-title>
            <ion-buttons slot="end">
              <ion-button onClick={() => this.rotatePhoto(currentId)}>
                <ion-icon color="light" name="sync"></ion-icon>
              </ion-button>
              <ion-button onClick={() => this.present.deletePhoto(currentId, this)}>
                <ion-icon color="light" name="trash"></ion-icon>
              </ion-button>
              <ion-button disabled={!nextAndPreviousPhoto.previousId} onClick={() => this.gotoPhotoWithId(nextAndPreviousPhoto.previousId)}>
                <ion-icon color="light" name="arrow-back"></ion-icon>
              </ion-button>
              <ion-button disabled={!nextAndPreviousPhoto.nextId} onClick={() => this.gotoPhotoWithId(nextAndPreviousPhoto.nextId)}>
                <ion-icon color="light" name="arrow-forward"></ion-icon>
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>

        <ion-content text-center class="photo-page">
          <BlockImg id={currentId} rotate={true} />
        </ion-content>
      </React.Fragment>
    );
  }

}
