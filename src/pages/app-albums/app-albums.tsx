import { Component } from '@stencil/core';

@Component({
  tag: 'app-albums'
})
export class AppAlbums {

  render() {
    return [
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title>Albums</ion-title>
          <ion-buttons slot="end">
            <ion-button>
              <ion-icon name="add-circle"></ion-icon>
            </ion-button>
            <ion-menu-button/>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>,

      <ion-content>

      </ion-content>
    ];
  }
}
