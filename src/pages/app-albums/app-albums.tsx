import { Component, State } from '@stencil/core';

import AlbumsService from '../../services/albums-service';
import AnalyticsService from '../../services/analytics-service';
import PresentingService from '../../services/presenting-service';

@Component({
  tag: 'app-albums'
})
export class AppAlbums {

  private albumsService: AlbumsService;
  private present: PresentingService;

  @State() albums: any[] = [];

  constructor() {

    this.albumsService = new AlbumsService();
    this.present = new PresentingService();
  }

  async componentDidLoad() {

    this.loadAlbums(false);

    AnalyticsService.logEvent('photos-list');
  }

  async loadAlbums(sync?: boolean) {
    try {
      await this.present.loading('Loading albums...');

      const albumsResponse = await this.albumsService.getAlbums(sync);
      this.albums = albumsResponse.albums;

      await this.present.dismissLoading();

      this.handleAlbumErrors(albumsResponse);
    } catch (error) {

      await this.present.dismissLoading();

      this.present.toast('Could not load albums. Please try again!');

    }
  }

  private handleAlbumErrors(albumsResponse: any) {

    if (albumsResponse.errorsList && albumsResponse.errorsList.length > 0) {
      for (const error of albumsResponse.errorsList) {
        if (error.errorCode === 'err_cache') {
          this.present.toast('Failed to load local albums. Please try again!');
        } else if (error.errorCode) {
          this.present.toast('Could not load albums from blockstack. Please try again or create some albums if you have none!');
        }
      }
    }
  }

  async presentCreateAlbumPrompt() {
    const alertController = document.querySelector('ion-alert-controller');
    await alertController.componentOnReady();

    const alert = await alertController.create({
      header: 'Create a new Album',
      inputs: [
        {
          name: 'albumName',
          id: 'album-name',
          placeholder: 'Album name'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: 'Create',
          cssClass: 'primary',
          handler: async (album) => {

            try {

              const albumsResponse = await this.albumsService.createAlbum(album.albumName);
              this.albums = albumsResponse.albums;

              this.handleAlbumErrors(albumsResponse);

            } catch (error) {

              this.present.toast('Could not create album. Please try again!');

            }
          }
        }
      ]
    });
    return alert.present();
  }

  render() {

    let rows = [];
    let empty = true;
    if (this.albums && this.albums.length > 0) {
      rows = this.chunk(this.albums, 2);
      empty = false;
    }

    return [
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title>Albums</ion-title>
          <ion-buttons slot="end">
            <ion-button onClick={() => this.presentCreateAlbumPrompt()}>
              <ion-icon name="add-circle"></ion-icon>
            </ion-button>
            <ion-menu-button />
          </ion-buttons>
        </ion-toolbar>
      </ion-header>,

      <ion-content>
        {empty ? (<ion-card padding text-center><h2>Welcome to Block Photos albums section.</h2><h3>Use the add button (<ion-icon size="small" name="add-circle"></ion-icon>) to add your first photo.</h3></ion-card>) : (
          <ion-grid no-padding>
            {rows.map((row) => (
              <ion-row align-items-center key={row[0].albumId}>
                {
                  row.map((col) => (
                    <ion-col no-padding align-self-stretch key={col.albumId}>
                      <ion-card>
                        {col.thumbnailId ? (
                          <div class="square" draggable={false}>
                            <block-img photoId={col.thumbnailId} />
                          </div>
                        ) : (
                          <ion-img src="/assets/placeholder-image.jpg"></ion-img>
                        )}
                        <ion-card-header>
                          <ion-card-subtitle>{col.albumName}</ion-card-subtitle>
                        </ion-card-header>
                      </ion-card>
                    </ion-col>
                  ))
                }
              </ion-row>
            ))}
          </ion-grid>
        )}
      </ion-content>
    ];
  }

  chunk = (input, size) => {
    return input.reduce((arr, item, idx) => {
      return idx % size === 0
        ? [...arr, [item]]
        : [...arr.slice(0, -1), [...arr.slice(-1)[0], item]];
    }, []);
  }
}
