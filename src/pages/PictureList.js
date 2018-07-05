import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { ipcRenderer } from 'electron';
import uniqid from 'uniqid';
import { isUserSignedIn, putFile, getFile } from 'blockstack';
import _ from 'lodash';

import PictureService from '../services/PictureService.js';
import BlockImg from '../components/BlockImg.js';
import Header from '../components/Header.js';

export default class PictureList extends Component {

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
    for (let file of filesData) {
      let id = uniqid() + file.filename;
      let metadata = {
        "id": id,
        "uploadedDate": new Date()
      };
      await putFile(id, file.data);
      this.state.pictureList.unshift(metadata);
    }

    await putFile("picture-list.json", JSON.stringify(this.state.pictureList));
    this.setState({ pictureList: this.state.pictureList });
  }

  render() {
    let rows = [];
    if (this.state.pictureList && this.state.pictureList.length > 0) {
      rows = _.chunk(this.state.pictureList, 3);
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

  async componentWillMount() {

    // Go to signin page if no active session exist
    if (!isUserSignedIn()) {
      const { history } = this.props;
      history.replace('/');
      return;
    }

    // Init state
    this.setState({ pictureList: [] });

    try {
      // Get the contents of the file picture-list.json
      let pictureList = await this.pictureService.getPictures(true);
      this.setState({ pictureList: pictureList });
    } catch (error) {
      console.log('PictureService error!');
      console.log(error);
    }
  }

}
