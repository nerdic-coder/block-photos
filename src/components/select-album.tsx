import { Component, Prop, State, h } from '@stencil/core';

import AlbumsService from '../services/albums-service';
import PresentingService from '../services/presenting-service';
import PhotosService from '../services/photos-service';

@Component({
  tag: 'select-album'
})
export class SelectAlbum {
  private present: PresentingService;

  @State() albums: any[] = [];
  @State() isLoaded: boolean;

  @Prop() selectedPhotos: any[] = [];
  @Prop() startCallback: any;
  @Prop() endCallback: any;

  constructor() {
    this.present = new PresentingService();
  }

  componentWillLoad() {
    this.isLoaded = false;
  }

  async componentDidLoad() {
    this.loadAlbums(false);
  }

  async loadAlbums(sync?: boolean) {
    try {
      const albumsResponse = await AlbumsService.getAlbums(sync);
      this.albums = albumsResponse.albums;

      this.isLoaded = true;

      this.handleAlbumErrors(albumsResponse);
    } catch (error) {
      this.isLoaded = true;
    }
  }

  private handleAlbumErrors(albumsResponse: any) {
    if (albumsResponse.errorsList && albumsResponse.errorsList.length > 0) {
      for (const error of albumsResponse.errorsList) {
        if (error.errorCode === 'err_cache') {
          this.present.toast('Failed to load local albums. Please try again!');
        } else if (error.errorCode) {
          this.present.toast(
            'Could not load albums from Blockstack. Please try again or create some albums if you have none!'
          );
        }
      }
    }
  }

  async addPhotosToAlbum(event: any, album: any) {
    event.preventDefault();
    if (this.startCallback) {
      this.startCallback();
    }
    await this.closePopover();
    const result: boolean = await PhotosService.addPhotosToAlbum(
      album.albumId,
      this.selectedPhotos
    );
    this.selectedPhotos = null;
    if (result) {
      this.present.toast('Photo(s) added to album "' + album.albumName + '".');
    } else {
      this.present.toast(
        'Failed to add photo(s) to album "' + album.albumName + '".'
      );
    }
    if (this.endCallback) {
      this.endCallback();
    }
  }

  async closePopover() {
    const popoverController = document.querySelector('ion-popover-controller');
    popoverController.dismiss();
  }

  render() {
    if (this.isLoaded) {
      return (
        <ion-list>
          <ion-list-header>
            <ion-label>Add to album</ion-label>
          </ion-list-header>
          {this.albums.map(album => (
            <ion-item
              class="pointer"
              detail={false}
              onClick={event => this.addPhotosToAlbum(event, album)}
            >
              <ion-label>{album.albumName}</ion-label>
            </ion-item>
          ))}
        </ion-list>
      );
    } else {
      return <ion-spinner name="circles" color="tertiary" />;
    }
  }
}
