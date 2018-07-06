import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { ipcRenderer } from 'electron';
import { isUserSignedIn } from 'blockstack';
import _ from 'lodash';

import PictureService from '../services/PictureService.js';
import BlockImg from '../components/BlockImg.js';
import Header from '../components/Header.js';

export default class PicturesList extends Component {

  constructor(props) {
    super(props);

    this.pictureService = new PictureService();
  }

  handleUpload() {
    ipcRenderer.send('open-file-dialog');
    ipcRenderer.on('upload-files', this.uploadFiles.bind(this));
  }

  async uploadFiles(event, filesData) {
    ipcRenderer.removeAllListeners('upload-files');
    let picturesList = await this.pictureService.uploadPictures(filesData);
    this.setState({ picturesList: picturesList });
  }

  render() {
    let rows = [];
    if (this.state.picturesList && this.state.picturesList.length > 0) {
      rows = _.chunk(this.state.picturesList, 3);
    }
    return (
      <React.Fragment>
        <Header />
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

  componentWillMount() {

    // Go to signin page if no active session exist
    if (!isUserSignedIn()) {
      const { history } = this.props;
      history.replace('/');
      return;
    }

    // Init state
    this.setState({ picturesList: [] });

    this.loadPicturesList();
  }

  async loadPicturesList() {
    try {
      // Get the contents of the file picture-list.json
      let picturesList = await this.pictureService.getPicturesList();
      this.setState({ picturesList: picturesList });
    } catch (error) {
      console.log('PictureService error!');
      console.log(error);
    }
  }

}
