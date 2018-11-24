import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { isUserSignedIn } from 'blockstack';
import _ from 'lodash';
import { ContextMenu, MenuItem, ContextMenuTrigger } from "react-contextmenu";

import PictureService from '../services/PictureService';
import PresentingService from '../services/PresentingService';
import UploadService from '../services/UploadService';
import BlockImg from '../components/BlockImg';

export default class PicturesList extends Component {

  _isMounted = false;

  static propTypes = {
    history: PropTypes.any
  };

  state = {
    picturesList: [],
    refreshPicture: []
  };

  constructor(props) {
    super(props);

    this.pictureService = new PictureService();
    this.present = new PresentingService();
    this.uploadService = new UploadService(this.uploadFilesDoneCallback.bind(this));
    this.picturesRangeListener = this.loadPicturesRange.bind(this);
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
    this.picturesLoaded= 0;

    this.infiniteScroll = document.getElementById('infinite-scroll');
    if (this.infiniteScroll) {
      this.infiniteScroll.addEventListener('ionInfinite', this.picturesRangeListener);
    }
    this.uploadService.addEventListeners(true);
    this.loadPicturesList(false);

    if (window.gtag) {
      window.gtag('event', 'pictures-list');
    }
  }

  componentWillUnmount() {
    this._isMounted = false;

    this.uploadService.removeEventListeners(true);
    if (this.infiniteScroll) {
      this.infiniteScroll.removeEventListener('ionInfinite', this.picturesRangeListener);
    }
  }

  async loadPicturesList(sync) {
    try {
      await this.present.loading('Loading pictures...');

      // Get the contents of the file picture-list.json
      let picturesListResponse = await this.pictureService.getPicturesList(sync);
      this.picturesListCached = picturesListResponse.picturesList;
      this.present.dismissLoading();

      this.loadPicturesRange();
      
      if (picturesListResponse.errorsList && picturesListResponse.errorsList.length > 0) {
        for (let error in picturesListResponse.errorsList) {
          if (error.errorCode === 'err_cache') {
            this.present.toast('Failed to load cached list. Please try again!');
          } else if (error.errorCode) {
            this.present.toast('Could not load pictures from blockstack. Please try again or upload some pictures if you have none!');
          }
        }
      }

    } catch (error) {
      if (sync) {
        this.present.dismissLoading();
      }
      this.present.toast('Could not load pictures. Please try again!');
    }
  }

  loadPicturesRange(event) {
    setTimeout(() => {
      if (event) {
        this.infiniteScroll.complete();
      }
      if (this._isMounted) {
        const picturesToLoad = this.picturesLoaded + 21;
        if (picturesToLoad > this.picturesListCached.length) {
          this.setState({ picturesList: this.picturesListCached });
          if (event) {
            this.infiniteScroll.disabled = true;
          }
        } else {
          const picturesList = this.picturesListCached.slice(0, picturesToLoad);
          this.setState({ picturesList: picturesList });
          this.picturesLoaded = picturesToLoad;
        }
      }
    }, 500);
  }

  async rotatePicture(id) {
    await this.pictureService.rotatePicture(id);
    if (this._isMounted) {
      this.refreshPicture(id);
    }

    if (window.gtag) {
      window.gtag('event', 'pictures-list-rotate');
    }
  }

  uploadFilesDoneCallback() {
    this.loadPicturesList();

    if (window.gtag) {
      window.gtag('event', 'pictures-list-uploaded');
    }
  }

  deletePictureCallback(callbackComponent) {
    callbackComponent.loadPicturesList();

    if (window.gtag) {
      window.gtag('event', 'pictures-list-deleted');
    }
  }

  refreshPicture(id) {
    let tempRefreshPicture = this.state.refreshPicture;
    if (tempRefreshPicture[id]) {
      tempRefreshPicture[id] = false;
    } else {
      tempRefreshPicture[id] = true;
    }
    this.setState({refreshPicture: tempRefreshPicture});
  }

  openFileDialog(event) {
    if (event) {
      event.preventDefault();
    }
    document.getElementById('file-upload').click();

    if (window.gtag) {
      window.gtag('event', 'pictures-list-file-dialog');
    }
  }

  render() {
    let rows = [];
    if (this.state.picturesList && this.state.picturesList.length > 0) {
      rows = _.chunk(this.state.picturesList, 3);
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
              <ion-button onClick={() => this.loadPicturesList(true)}>
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
          <ion-grid no-padding>
            {rows.map((row) => (
              <ion-row align-items-center key={row[0].id}>
                {
                  row.map((col) => (
                    <ion-col no-padding align-self-center key={col.id}>
                      <ContextMenuTrigger id={col.id}>
                        <Link to={"/picture/" + col.id}>
                        <div className="square">
                          <BlockImg id={col.id} refresh={this.state.refreshPicture[col.id]} />
                        </div>
                        </Link>
                        <ContextMenu id={col.id} className="pointer">
                          <ion-list>
                            <MenuItem onClick={() => this.rotatePicture(col.id)}>
                              <ion-item>
                                <ion-icon name="sync"></ion-icon>
                                <ion-label>Rotate picture</ion-label>
                              </ion-item>
                            </MenuItem>
                            <MenuItem onClick={() => this.present.deletePicture(col.id, this)}>
                              <ion-item>
                                <ion-icon name="trash"></ion-icon>
                                <ion-label>Delete picture</ion-label>
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
          <ion-infinite-scroll threshold="100px" id="infinite-scroll">
          <ion-infinite-scroll-content
            loading-spinner="bubbles"
            loading-text="Loading more pictures...">
          </ion-infinite-scroll-content>
        </ion-infinite-scroll>
        </ion-content>
      </React.Fragment>
    );
  }

}
