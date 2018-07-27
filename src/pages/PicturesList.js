import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { ipcRenderer } from 'electron';
import { isUserSignedIn } from 'blockstack';
import _ from 'lodash';

import PictureService from '../services/PictureService.js';
import BlockImg from '../components/BlockImg.js';

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
    this.loadPicturesList(false);
  }

  async loadPicturesList(sync) {
    try {
      await this.presentListLoading('Loading pictures...');
      // Get the contents of the file picture-list.json
      let picturesListResponse = await this.pictureService.getPicturesList(sync);
      this.loadingElement.dismiss();
      this.setState({ picturesList: picturesListResponse.picturesList });

      if (picturesListResponse.errorsList && picturesListResponse.errorsList.length > 0) {
        for (let error in picturesListResponse.errorsList) {
          if (error.errorCode === 'err_cache') {
            this.presentToast('Failed to load cached list. Please try again!');
          } else if (error.errorCode) {
            this.presentToast('Could not load pictures from blockchain. Please try again or upload some pictures if you have none!');
          }
        }
      }

    } catch (error) {
      this.loadingElement.dismiss();
      this.presentToast('Could not load pictures. Please try again!');
    }
  }

  handleUpload() {
    ipcRenderer.send('open-file-dialog');
    ipcRenderer.on('upload-files', this.uploadFiles.bind(this));
  }

  async uploadFiles(event, filesData) {
    ipcRenderer.removeAllListeners('upload-files');
    if (filesData && filesData.length > 0) {
      this.presentListLoading('Pictures uploading...');
      const response = await this.pictureService.uploadPictures(filesData);
      this.setState({ picturesList: response.picturesList });
      this.loadingElement.dismiss();
      if (response.errorsList && response.errorsList.length > 0) {
        for (let error of response.errorsList) {
          if (error.errorCode === 'err_filesize') {
            this.presentToast('Failed to upload "' + error.id + '", picture exceeds file size limit of 5MB.');
          } else {
            this.presentToast('Failed to upload "' + error.id + '".');
          }
        }
      }
    }
  }

  async presentListLoading(content) {
    const loadingController = document.querySelector('ion-loading-controller');
    await loadingController.componentOnReady();

    this.loadingElement = await loadingController.create({
      content: content,
      spinner: 'circles'
    });
    return await this.loadingElement.present();
  }

  async presentToast(message) {
    const toastController = document.querySelector('ion-toast-controller');
    await toastController.componentOnReady();

    const toast = await toastController.create({
      message: message,
      showCloseButton: true
    });
    return await toast.present();
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
              <ion-row key={row[0].id}>
                {
                  row.map((col) => (
                    <ion-col key={col.id}>
                      <Link to={"/picture/" + col.id}>
                        <BlockImg id={col.id} />
                      </Link>
                    </ion-col>
                  ))
                }
              </ion-row>
            ))}
          </ion-grid>
        </ion-content>
        <ion-fab vertical="bottom" horizontal="end" slot="fixed">
          <ion-fab-button onClick={() => this.handleUpload()}>
            <ion-icon name="add"></ion-icon>
          </ion-fab-button>
        </ion-fab>
      </React.Fragment>
    );
  }

}
