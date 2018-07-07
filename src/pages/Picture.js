import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { isUserSignedIn } from 'blockstack';

import PictureService from '../services/PictureService.js';
import BlockImg from '../components/BlockImg.js';

export default class PicturesList extends Component {

  constructor(props) {
    super(props);

    this.pictureService = new PictureService();
  }

  render() {
    return (
      <React.Fragment>
        <ion-header>
          <ion-toolbar>
            <ion-buttons slot="start">
              <Link to="/pictures">
                <ion-back-button default-href="/pictures"></ion-back-button>
              </Link>
            </ion-buttons>
            <ion-title>Block Photo</ion-title>
            <ion-buttons slot="end">
              <ion-button icon-end onClick={() => this.deletePicture()}>
                <ion-icon name="trash"></ion-icon>
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>

        <ion-content text-center class="picture-background">
          <BlockImg id={this.props.match.params.id} />
        </ion-content>
        <ion-alert-controller />
        <ion-action-sheet-controller />
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

    // Go to pictures list if picture id is missing
    if (!this.props.match.params.id) {
      const { history } = this.props;
      history.replace('/pictures');
      return;
    }

  }

  async deletePicture() {
    const actionSheetController = document.querySelector('ion-action-sheet-controller');
    await actionSheetController.componentOnReady();

    const actionSheet = await actionSheetController.create({
      header: "Delete picture?",
      buttons: [{
        text: 'Delete',
        role: 'destructive',
        icon: 'trash',
        handler: async () => {
          let result = await this.pictureService.deletePicture(this.props.match.params.id);
          if (result === true) {
            const { history } = this.props;
            history.replace('/pictures');
          } else {
            this.presentDeleteError();
          }
        }
      }, {
        text: 'Cancel',
        icon: 'close',
        role: 'cancel'
      }]
    });
    await actionSheet.present();

  }

  async presentDeleteError() {
    const alertController = document.querySelector('ion-alert-controller');
    await alertController.componentOnReady();

    const alert = await alertController.create({
      header: 'Removal failed',
      subHeader: '',
      message: 'The removal of the picture failed. Please try again in a few minutes!',
      buttons: ['OK']
    });
    return await alert.present();
  }
}
