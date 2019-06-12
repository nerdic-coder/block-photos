import { Component, Prop, State } from '@stencil/core';
import loadImage from 'blueimp-load-image';
import Downloader from 'js-file-downloader';

import PresentingService from '../../services/presenting-service';
import PhotosService from '../../services/photos-service';
import { PhotoType } from '../../models/photo-type';
import { Plugins } from '@capacitor/core';
import SettingsService from '../../services/settings-service';

declare var blockstack;

@Component({
  tag: 'app-shared',
  styleUrl: 'app-shared.css'
})
export class AppShared {
  private present: PresentingService;
  private photoType: PhotoType = PhotoType.Download;

  @Prop() photoId: string;
  @Prop() username: string;

  @State() isIpad: boolean;
  @State() downloadInProgress: boolean;
  @State() importInProgress: boolean;
  @State() photo: any;
  @State() isUserSignedIn: boolean;

  constructor() {
    this.photo = {
      photoId: this.photoId,
      source: '',
      isLoaded: false,
      metadata: {}
    };
    this.present = new PresentingService();
  }

  async componentWillLoad() {
    console.log('photoId', this.photoId);
    console.log('userId', this.username);
    const { Device } = Plugins;
    const info = await Device.getInfo();
    if (info.model === 'iPad') {
      this.isIpad = true;
    }

    const appConfig = SettingsService.getAppConfig();
    const userSession = new blockstack.UserSession({ appConfig });
    this.isUserSignedIn = userSession.isUserSignedIn();

    await this.getPhoto(this.photoId);
  }

  async getPhoto(photoId: string): Promise<void> {
    let rotation = 1;
    const profile = await blockstack.lookupProfile(this.username);
    console.log(profile);
    const metadata: PhotoMetadata = await PhotosService.getPhotoMetaData(
      photoId + '-shared',
      this.username,
      false
    );

    metadata.id = metadata.id + '-shared';
    this.photo.metadata = metadata;
    console.log('this.photo.metadata', this.photo.metadata);

    if (
      metadata &&
      metadata.stats &&
      metadata.stats.exifdata &&
      metadata.stats.exifdata.tags.Orientation
    ) {
      rotation = metadata.stats.exifdata.tags.Orientation;
    }

    if (rotation !== 1) {
      loadImage(
        await PhotosService.loadPhoto(
          metadata,
          this.photoType,
          false,
          this.username,
          false
        ),
        processedPhoto => {
          this.handleProcessedPhoto(processedPhoto);
        },
        {
          orientation: rotation
        }
      );
    } else {
      this.photo.source = await PhotosService.loadPhoto(
        metadata,
        this.photoType,
        false,
        this.username,
        false
      );
      this.photo = {
        photoId: this.photo.photoId,
        isLoaded: true,
        source: this.photo.source,
        metadata: this.photo.metadata
      };
    }
  }

  async handleProcessedPhoto(processedPhoto: any): Promise<void> {
    if (processedPhoto.type === 'error') {
      // TODO: show error message
    } else if (processedPhoto.tagName === 'CANVAS') {
      this.photo.source = processedPhoto.toDataURL();
    } else {
      this.photo.source = processedPhoto.src;
    }
    this.photo = {
      photoId: this.photo.photoId,
      isLoaded: true,
      source: this.photo.source,
      metadata: this.photo.metadata
    };
  }

  preventDrag(event: any): boolean {
    event.preventDefault();
    return false;
  }

  async downloadOriginal(event: MouseEvent): Promise<void> {
    event.preventDefault();
    this.downloadInProgress = true;

    new Downloader({
      url: this.photo.source,
      filename: this.photo.metadata.filename
    })
      .then(() => {
        // Called when download ended
        this.downloadInProgress = false;
      })
      .catch(error => {
        // Called when an error occurred
        console.error(error);
        this.downloadInProgress = false;
        this.present.toast('Downloading of the photo failed!');
      });
  }

  async importPhoto(event: MouseEvent) {
    event.preventDefault();
    this.importInProgress = true;
    await PhotosService.uploadPhoto(this.photo.metadata, this.photo.source);
    this.importInProgress = false;
  }

  render() {
    return [
      <ion-header mode="md">
        <ion-toolbar mode="md" color="primary">
          {/* <ion-buttons slot="start">
          </ion-buttons> */}
          <ion-title>Shared Photo</ion-title>
          <ion-buttons slot="end">
            <ion-button
              fill="outline"
              color="secondary"
              class="ion-hide-sm-down"
              hidden={this.isIpad}
              disabled={this.downloadInProgress || this.importInProgress}
              onClick={event => this.downloadOriginal(event)}
            >
              <ion-label color="light">Download</ion-label>
              {this.downloadInProgress ? (
                <ion-spinner name="circles" slot="end" color="light" />
              ) : (
                <ion-icon slot="end" color="light" name="download" />
              )}
            </ion-button>
            <ion-button
              fill="outline"
              color="secondary"
              class="ion-hide-sm-down"
              hidden={!this.isUserSignedIn}
              disabled={this.downloadInProgress || this.importInProgress}
              onClick={event => this.importPhoto(event)}
            >
              <ion-label color="light">Import</ion-label>
              {this.importInProgress ? (
                <ion-spinner name="circles" slot="end" color="light" />
              ) : (
                <ion-icon slot="end" color="light" name="photos" />
              )}
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>,

      <ion-content scroll-y={false} scroll-x={false} color="dark">
        <ion-slides pager={false}>
          <ion-slide>
            <div
              class={
                'swiper-zoom-container' + (this.photo.isLoaded ? '' : ' hidden')
              }
            >
              <img
                src={this.photo.source}
                draggable={false}
                onDragStart={event => this.preventDrag(event)}
              />
            </div>
            <ion-spinner
              name="circles"
              color="tertiary"
              class={this.photo.isLoaded ? 'hidden' : ''}
            />
          </ion-slide>
        </ion-slides>
      </ion-content>
    ];
  }
}
