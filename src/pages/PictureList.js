import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { ipcRenderer } from 'electron';

import { isUserSignedIn } from 'blockstack';

import Header from '../components/Header.js';

export default class PictureList extends Component {

  constructor(props) {
    super(props);
  }

  handleUpload() {
    ipcRenderer.send('open-file-dialog');
  }

  render() {
    return (
      <React.Fragment>
        <Header />
        <ion-content>
          <ion-grid>
            <ion-row>
              <ion-col>
                <Link to="/picture">
                  <ion-img src="https://placekitten.com/400/400"></ion-img>
                </Link>
              </ion-col>
              <ion-col>
                <div>
                  <ion-img src="https://placekitten.com/400/400"></ion-img>
                </div>
              </ion-col>
              <ion-col>
                <div>
                  <ion-img src="https://placekitten.com/400/400"></ion-img>
                </div>
              </ion-col>
            </ion-row>
            <ion-row>
              <ion-col>
                <div>
                  <ion-img src="https://placekitten.com/400/400"></ion-img>
                </div>
              </ion-col>
              <ion-col>
                <div>
                  <ion-img src="https://placekitten.com/400/400"></ion-img>
                </div>
              </ion-col>
              <ion-col>
                <div>
                  <ion-img src="https://placekitten.com/400/400"></ion-img>
                </div>
              </ion-col>
            </ion-row>
            <ion-row>
              <ion-col>
                <div>
                  <ion-img src="https://placekitten.com/400/400"></ion-img>
                </div>
              </ion-col>
              <ion-col>
                <div>
                  <ion-img src="https://placekitten.com/400/400"></ion-img>
                </div>
              </ion-col>
              <ion-col>
                <div>
                  <ion-img src="https://placekitten.com/400/400"></ion-img>
                </div>
              </ion-col>
            </ion-row>
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
    if (!isUserSignedIn()) {
      const { history } = this.props;
      history.replace('/');
      return;
    }
  }

}
