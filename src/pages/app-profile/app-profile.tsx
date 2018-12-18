import { Component } from '@stencil/core';

@Component({
  tag: 'app-profile'
})
export class AppProfile {

  render() {
    return [
      <ion-header>
        <ion-toolbar color="primary">
          <ion-buttons slot="start">
            <ion-back-button defaultHref="/" />
          </ion-buttons>
          <ion-title>Profile</ion-title>
        </ion-toolbar>
      </ion-header>,

      <ion-content padding>

      </ion-content>
    ];
  }
}
