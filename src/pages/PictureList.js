import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { ipcRenderer } from 'electron';
import uniqid from 'uniqid';
import { isUserSignedIn, putFile, getFile } from 'blockstack';
import _ from 'lodash';

import Header from '../components/Header.js';

export default class PictureList extends Component {

  constructor(props) {
    super(props);
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
      let liveMetadata = {
        "id": id,
        "base64": file.data,
        "uploadedDate": new Date()
      };
      await putFile(id, file.data);
      this.state.pictureList.unshift(liveMetadata);
      this.pictureList.unshift(metadata);
    }

    await putFile("picture-list.json", JSON.stringify(this.pictureList));
    this.setState({ pictureList: this.state.pictureList });
  }

  async loadPicture(id) {
    let data = await getFile(id);
    return data;
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
                        <ion-img src={'data:image/png;base64,' + col.base64} />
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
      let pictureList = await getFile("picture-list.json");
      if (pictureList) {
        this.pictureList = JSON.parse(pictureList);
        let pictures = [];
        for (let picture of this.pictureList) {
          picture.base64 = await this.loadPicture(picture.id);
          pictures.push(picture);
        }
        this.setState({ pictureList: pictures });
      }
    } catch (error) {
      console.log('Blockstack error!');
      console.log(error);
    }
  }

}
