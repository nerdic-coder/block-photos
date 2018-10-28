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
    picturesList: []
  };

  constructor(props) {
    super(props);

    this.pictureService = new PictureService();
    this.present = new PresentingService();
    this.uploadService = new UploadService(this.uploadFilesDoneCallback.bind(this));

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

    this.uploadService.addEventListeners(true);
    this.loadPicturesList(false);
  }

  componentWillUnmount() {
    this._isMounted = false;

    this.uploadService.removeEventListeners(true);
  }

  async loadPicturesList(sync) {
    try {
      if (sync) {
        await this.present.loading('Loading pictures...');
      }
      // Get the contents of the file picture-list.json
      let picturesListResponse = await this.pictureService.getPicturesList(sync);

      if (sync) {
        this.present.dismissLoading();
      }

      if (this._isMounted) {
        this.setState({ picturesList: picturesListResponse.picturesList });
      }
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

  async rotatePicture(id) {
    const picturesList = await this.pictureService.rotatePicture(id);
    if (this._isMounted) {
      this.setState({ picturesList: [] });
      this.setState({ picturesList: picturesList });
    }
  }

  uploadFilesDoneCallback() {
    this.loadPicturesList();
  }

  deletePictureCallback(callbackComponent) {
    callbackComponent.loadPicturesList();
  }

  render() {
    let rows = [];
    if (this.state.picturesList && this.state.picturesList.length > 0) {
      rows = _.chunk(this.state.picturesList, 3);
    }
    return (
      <React.Fragment>
        <ion-header>
          <ion-toolbar>
            <ion-title>Block Photos</ion-title>
            <ion-buttons slot="end">
              <label htmlFor="file-upload" className="custom-file-upload">
                <ion-icon name="add" size="large"></ion-icon>
              </label>
              <input id="file-upload" type="file" multiple />
              <ion-button onClick={() => this.loadPicturesList(true)}>
                <ion-icon color="dark" name="refresh"></ion-icon>
              </ion-button>
              <Link to="/profile">
                <ion-button>
                  <ion-icon color="dark" name="person"></ion-icon>
                </ion-button>
              </Link>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <ion-grid>
            {rows.map((row) => (
              <ion-row align-items-center key={row[0].id}>
                {
                  row.map((col) => (
                    <ion-col align-self-center key={col.id}>
                      <ContextMenuTrigger id={col.id}>
                        <Link to={"/picture/" + col.id}>
                        <div className="square">
                          <BlockImg id={col.id} aspectRatio={1/1} />
                        </div>
                        </Link>
                        <ContextMenu id={col.id} className="pointer">
                          <ion-list>
                            <MenuItem onClick={() => this.present.deletePicture(col.id, this)}>
                              <ion-item>
                                <ion-icon name="trash"></ion-icon>
                                <ion-label>Delete picture</ion-label>
                              </ion-item>
                            </MenuItem>
                            <MenuItem onClick={() => this.rotatePicture(col.id)}>
                              <ion-item>
                                <ion-icon name="sync"></ion-icon>
                                <ion-label>Rotate picture</ion-label>
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
        </ion-content>
      </React.Fragment>
    );
  }

}
