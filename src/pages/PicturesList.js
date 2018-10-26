import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import isElectron from 'is-electron';
import { isUserSignedIn } from 'blockstack';
import _ from 'lodash';
import { ContextMenu, MenuItem, ContextMenuTrigger } from "react-contextmenu";

import PictureService from '../services/PictureService.js';
import PresentingService from '../services/PresentingService.js';
import BlockImg from '../components/BlockImg.js';
import ElectronService from '../services/ElectronService';

export default class PicturesList extends Component {

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
    if (isElectron()) {
      ElectronService.on('upload-files', this.uploadFiles.bind(this));
    }
    this.loadPicturesList(false);
  }

  componentWillUnmount() {
    if (isElectron()) {
      ElectronService.removeAllListeners('upload-files');
    }
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

      this.setState({ picturesList: picturesListResponse.picturesList });

      if (picturesListResponse.errorsList && picturesListResponse.errorsList.length > 0) {
        for (let error in picturesListResponse.errorsList) {
          if (error.errorCode === 'err_cache') {
            this.present.toast('Failed to load cached list. Please try again!');
          } else if (error.errorCode) {
            this.present.toast('Could not load pictures from blockchain. Please try again or upload some pictures if you have none!');
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
    this.setState({ picturesList: [] });
    this.setState({ picturesList: picturesList });
  }

  handleUpload() {
    if (isElectron()) {
      ElectronService.send('open-file-dialog');
    }
  }

  async uploadFiles(event, filesData) {
    if (filesData && filesData.length > 0) {
      this.present.loading('Pictures uploading...');
      const response = await this.pictureService.uploadPictures(filesData);
      this.setState({ picturesList: response.picturesList });
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
              <ion-button onClick={() => this.loadPicturesList(true)}>
                <ion-icon name="refresh"></ion-icon>
              </ion-button>
              <Link to="/profile">
                <ion-button>
                  <ion-icon name="person"></ion-icon>
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
        {isElectron() ?
        (
          <ion-fab vertical="bottom" horizontal="end" slot="fixed">
            <ion-fab-button onClick={() => this.handleUpload()}>
              <ion-icon name="add"></ion-icon>
            </ion-fab-button>
          </ion-fab>
        ) : ( null )
        }
      </React.Fragment>
    );
  }

}
