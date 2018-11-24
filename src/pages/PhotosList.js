import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { isUserSignedIn } from 'blockstack';
import _ from 'lodash';
import { ContextMenu, MenuItem, ContextMenuTrigger } from "react-contextmenu";

import PhotosService from '../services/PhotosService';
import PresentingService from '../services/PresentingService';
import UploadService from '../services/UploadService';
import BlockImg from '../components/BlockImg';

export default class PhotosList extends Component {

  _isMounted = false;

  static propTypes = {
    history: PropTypes.any
  };

  state = {
    photosList: [],
    refreshPhoto: [],
    listLoaded: false
  };

  constructor(props) {
    super(props);

    this.photosService = new PhotosService();
    this.present = new PresentingService();
    this.uploadService = new UploadService(this.uploadFilesDoneCallback.bind(this));
    this.photosRangeListener = this.loadPhotosRange.bind(this);
    // Go to signin page if no active session exist
    if (!isUserSignedIn()) {
      const { history } = this.props;
      if (history) {
        history.replace('/');
      }
      return;
    }
  }

  componentDidMount() {
    this._isMounted = true;
    this.photosLoaded= 0;

    this.infiniteScroll = document.getElementById('infinite-scroll');
    if (this.infiniteScroll) {
      this.infiniteScroll.addEventListener('ionInfinite', this.photosRangeListener);
    }
    this.uploadService.addEventListeners(true);
    this.loadPhotosList(false);

    if (window.gtag) {
      window.gtag('event', 'photos-list');
    }
  }

  componentWillUnmount() {
    this._isMounted = false;

    this.uploadService.removeEventListeners(true);
    if (this.infiniteScroll) {
      this.infiniteScroll.removeEventListener('ionInfinite', this.photosRangeListener);
    }
  }

  async loadPhotosList(sync) {
    try {
      await this.present.loading('Loading photos...');

      // Get the contents of the file photo-list.json
      let photosListResponse = await this.photosService.getPhotosList(sync);
      this.photosListCached = photosListResponse.photosList;
      this.present.dismissLoading();

      this.loadPhotosRange();
      
      if (photosListResponse.errorsList && photosListResponse.errorsList.length > 0) {
        for (let error in photosListResponse.errorsList) {
          if (error.errorCode === 'err_cache') {
            this.present.toast('Failed to load cached list. Please try again!');
          } else if (error.errorCode) {
            this.present.toast('Could not load photos from blockstack. Please try again or upload some photos if you have none!');
          }
        }
      }

    } catch (error) {
      if (sync) {
        this.present.dismissLoading();
      }
      this.present.toast('Could not load photos. Please try again!');
    }
  }

  loadPhotosRange(event) {
    setTimeout(() => {
      if (event) {
        this.infiniteScroll.complete();
      }
      if (this._isMounted) {
        const photosToLoad = this.photosLoaded + 21;
        if (photosToLoad > this.photosListCached.length) {
          this.setState({ photosList: this.photosListCached, listLoaded: true });
          if (event) {
            this.infiniteScroll.disabled = true;
          }
        } else {
          const photosList = this.photosListCached.slice(0, photosToLoad);
          this.setState({ photosList: photosList, listLoaded: true });
          this.photosLoaded = photosToLoad;
        }
      }
    }, 500);
  }

  async rotatePhoto(id) {
    await this.photosService.rotatePhoto(id);
    if (this._isMounted) {
      this.refreshPhoto(id);
    }

    if (window.gtag) {
      window.gtag('event', 'photos-list-rotate');
    }
  }

  uploadFilesDoneCallback() {
    this.loadPhotosList();

    if (window.gtag) {
      window.gtag('event', 'photos-list-uploaded');
    }
  }

  deletePhotoCallback(callbackComponent) {
    callbackComponent.loadPhotosList();

    if (window.gtag) {
      window.gtag('event', 'photos-list-deleted');
    }
  }

  refreshPhoto(id) {
    let tempRefreshPhoto = this.state.refreshPhoto;
    if (tempRefreshPhoto[id]) {
      tempRefreshPhoto[id] = false;
    } else {
      tempRefreshPhoto[id] = true;
    }
    this.setState({refreshPhoto: tempRefreshPhoto});
  }

  openFileDialog(event) {
    if (event) {
      event.preventDefault();
    }
    document.getElementById('file-upload').click();

    if (window.gtag) {
      window.gtag('event', 'photos-list-file-dialog');
    }
  }

  render() {
    let rows = [];
    let empty = true;
    if (this.state.photosList && this.state.photosList.length > 0) {
      rows = _.chunk(this.state.photosList, 3);
      empty = false;
    }
    return (
      <React.Fragment>
        <ion-header>
          <ion-toolbar color="primary">
            <ion-title class="unselectable">Block Photos</ion-title>
            <ion-buttons slot="end">
              <Link to="/profile" draggable="false">
                <ion-button>
                  <ion-icon color="light" name="person"></ion-icon>
                </ion-button>
              </Link>
              <ion-button onClick={() => this.loadPhotosList(true)}>
                <ion-icon name="refresh"></ion-icon>
              </ion-button>
              <ion-button onClick={(event) => this.openFileDialog(event)}>
                <ion-icon name="ios-cloud-upload"></ion-icon>
              </ion-button>
              <input id="file-upload" type="file" multiple />
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          {empty && this.state.listLoaded ? ( <ion-card padding text-center><h2>Welcome to Block Photos.</h2><h3>Use the upload button (<ion-icon size="small" name="ios-cloud-upload"></ion-icon>) to add your first photo.</h3></ion-card> ) : (
          <ion-grid no-padding>
            {rows.map((row) => (
              <ion-row align-items-center key={row[0].id}>
                {
                  row.map((col) => (
                    <ion-col no-padding align-self-center key={col.id}>
                      <ContextMenuTrigger id={col.id}>
                        <Link to={"/photo/" + col.id}>
                        <div className="square">
                          <BlockImg id={col.id} refresh={this.state.refreshPhoto[col.id]} />
                        </div>
                        </Link>
                        <ContextMenu id={col.id} className="pointer">
                          <ion-list>
                            <MenuItem onClick={() => this.rotatePhoto(col.id)}>
                              <ion-item>
                                <ion-icon name="sync"></ion-icon>
                                <ion-label>Rotate photo</ion-label>
                              </ion-item>
                            </MenuItem>
                            <MenuItem onClick={() => this.present.deletePhoto(col.id, this)}>
                              <ion-item>
                                <ion-icon name="trash"></ion-icon>
                                <ion-label>Delete photo</ion-label>
                              </ion-item>
                            </MenuItem>
                          </ion-list>
                        </ContextMenu>
                      </ContextMenuTrigger>
                    </ion-col>
                  ))
                }
              </ion-row>
            ))}
          </ion-grid>
          )}
          <ion-infinite-scroll threshold="100px" id="infinite-scroll">
          <ion-infinite-scroll-content
            loading-spinner="bubbles"
            loading-text="Loading more photos...">
          </ion-infinite-scroll-content>
        </ion-infinite-scroll>
        </ion-content>
      </React.Fragment>
    );
  }

}
