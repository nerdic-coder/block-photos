import { Component, Prop, State, h } from '@stencil/core';
import loadImage from 'blueimp-load-image';
import Downloader from 'js-file-downloader';

import PhotosService from '../../services/photos-service';
import PresentingService from '../../services/presenting-service';
import AnalyticsService from '../../services/analytics-service';
import { PhotoType } from '../../models/photo-type';
import { Plugins } from '@capacitor/core';
import SettingsService from '../../services/settings-service';

declare var blockstack;
declare var navigator;
// declare var Caman;

@Component({
  tag: 'app-photo',
  styleUrl: 'app-photo.css'
})
export class AppPhoto {
  private present: PresentingService;
  private modalController: HTMLIonModalControllerElement;
  private slides: HTMLIonSlidesElement;
  private firstSlide = true;
  private slideToOne = false;
  private keydownPressedListener: any;
  private photoType: PhotoType = PhotoType.Viewer;
  private updateFromSlide: boolean;
  private previousPhotoId: string;
  private nextPhotoId: string;

  @Prop({ mutable: true }) photoId: string;
  @Prop() albumId: string;
  @Prop() decrypt: boolean;
  @Prop() updateCallback: any;

  @State() photos: any[];
  @State() firstTimeLoaded: boolean;
  @State() downloadInProgress: boolean;
  @State() deleteInProgress: boolean;
  @State() rotationInProgress: boolean;
  @State() addToAlbumInProgress: boolean;
  @State() shareInProgress: boolean;
  @State() isIpad: boolean;

  constructor() {
    this.photos = [];
    this.present = new PresentingService();
    this.keydownPressedListener = this.checkKey.bind(this);
  }

  async componentWillLoad() {
    const { Device } = Plugins;
    const info = await Device.getInfo();
    if (info.model === 'iPad') {
      this.isIpad = true;
    }
    this.firstSlide = true;
  }

  async componentDidLoad() {
    const router: any = document.querySelector('ion-router');

    // Go to signin page if no active session exist
    const appConfig = SettingsService.getAppConfig();
    const userSession = new blockstack.UserSession({ appConfig });
    if (!userSession.isUserSignedIn()) {
      router.push('/', 'root');
      return;
    }

    // Go to photos list if photo id is missing
    if (!this.photoId) {
      router.push('/photos', 'root');
      return;
    }

    this.slides = document.querySelector('ion-slides');
    this.slides.options = {
      zoom: true,
      loop: false
    };

    this.updateFromSlide = false;
    this.photos = [
      ...this.photos,
      { photoId: this.photoId, isLoaded: false, source: '' }
    ];
    setTimeout(async () => {
      await this.setNextAndPreviousPhoto(this.photoId);
      this.updateFromSlide = true;
      await this.getPhoto(this.photoId, 1);

      this.modalController = document.querySelector('ion-modal-controller');

      document.addEventListener('keydown', this.keydownPressedListener);

      AnalyticsService.logEvent('photo-page');
    }, 500);
  }

  async componentDidUpdate() {
    if (!this.updateFromSlide) {
      return;
    }
    this.updateFromSlide = false;

    // if (this.slides) {
    //   this.slides.lockSwipes(false);
    // }
    if (this.slideToOne) {
      this.slideToOne = false;
      this.firstSlide = true;
      this.slideCorrection(0);
    } else {
      setTimeout(() => {
        this.firstTimeLoaded = true;
      }, 2000);
      this.firstSlide = false;
    }
  }

  async componentDidUnload() {
    document.removeEventListener('keydown', this.keydownPressedListener);
  }

  async slideCorrection(iteration: number) {
    await this.slides.update();
    await this.slides.slideTo(1, 0);
    if (
      (await this.slides.getActiveIndex()) === 0 &&
      iteration < 100 &&
      this.previousPhotoId
    ) {
      setTimeout(() => {
        this.slideCorrection(iteration + 1);
      }, 10);
    } else {
      setTimeout(() => {
        this.firstTimeLoaded = true;
      }, 2000);
    }
    // else {
    // const photoId = this.photoId;
    // Caman('#img-' + this.photoId, function() {
    //   this.greyscale();
    //   this.render(async () => {
    //     const result = await PhotosService.updatePhoto(photoId, this.toBase64());
    //     console.log('Caman result ', result);
    //   });
    // });
    // }
  }

  checkKey(event: any): void {
    event = event || window.event;

    if (event.keyCode === 37) {
      // left arrow
      this.slides.slidePrev();
    } else if (event.keyCode === 39) {
      // right arrow
      this.slides.slideNext();
    }
  }

  async getPhoto(
    photoId: string,
    index: number,
    newRotation?: number
  ): Promise<void> {
    let rotation = 1;
    const metadata: PhotoMetadata = await PhotosService.getPhotoMetaData(
      photoId,
      null,
      this.decrypt
    );

    if (newRotation) {
      rotation = newRotation;
    } else if (
      metadata &&
      metadata.stats &&
      metadata.stats.exifdata &&
      metadata.stats.exifdata.tags.Orientation
    ) {
      rotation = metadata.stats.exifdata.tags.Orientation;
      // Handle correct orientation for iOS
      // if (this.iOS() && metadata.stats.exifdata.tags.OriginalOrientation) {
      //   const originalOrientation =
      //     metadata.stats.exifdata.tags.OriginalOrientation;
      //   // If the orientation is unchanged don't rotate at all with CSS, iOS handles it automatic
      //   if (rotation === originalOrientation) {
      //     rotation = 1;
      //   } else if (rotation === 1 && originalOrientation === 6) {
      //     rotation = 8;
      //   } else if (rotation === 1) {
      //     rotation = originalOrientation;
      //   } else if (rotation === 3 && originalOrientation === 6) {
      //     rotation = 6;
      //   } else if (rotation === 8 && originalOrientation === 6) {
      //     rotation = 3;
      //   } else if (rotation === 3 && originalOrientation === 8) {
      //     rotation = 6;
      //   } else if (rotation === 6 && originalOrientation === 8) {
      //     rotation = 3;
      //   } else if (rotation === 8 && originalOrientation === 3) {
      //     rotation = 6;
      //   } else if (rotation === 6 && originalOrientation === 3) {
      //     rotation = 8;
      //   }
      // }
    }

    if (rotation !== 1) {
      loadImage(
        await PhotosService.loadPhoto(
          metadata,
          this.photoType,
          false,
          null,
          this.decrypt
        ),
        processedPhoto => {
          this.handleProcessedPhoto(processedPhoto, index, photoId);
        },
        {
          orientation: rotation
        }
      );
    } else {
      if (index === 0) {
        this.photos = [
          {
            photoId,
            isLoaded: true,
            source: await PhotosService.loadPhoto(
              metadata,
              this.photoType,
              false,
              null,
              this.decrypt
            )
          },
          ...this.photos
        ];
        this.slideToOne = true;
      } else if (index === 2) {
        this.photos = [
          ...this.photos,
          {
            photoId,
            isLoaded: true,
            source: await PhotosService.loadPhoto(
              metadata,
              this.photoType,
              false,
              null,
              this.decrypt
            )
          }
        ];
      } else {
        this.photos[
          this.getPhotoIndex(photoId)
        ].source = await PhotosService.loadPhoto(
          metadata,
          this.photoType,
          false,
          null,
          this.decrypt
        );
        this.photos[this.getPhotoIndex(photoId)].isLoaded = true;
      }
    }
  }

  async handleProcessedPhoto(
    processedPhoto: any,
    index: number,
    photoId: string
  ): Promise<void> {
    if (processedPhoto.type === 'error') {
      // TODO: show error message
    } else if (processedPhoto.tagName === 'CANVAS') {
      if (index === 0) {
        this.photos = [
          { photoId, isLoaded: true, source: processedPhoto.toDataURL() },
          ...this.photos
        ];
        this.slideToOne = true;
      } else if (index === 2) {
        this.photos = [
          ...this.photos,
          { photoId, isLoaded: true, source: processedPhoto.toDataURL() }
        ];
      } else {
        this.photos[
          this.getPhotoIndex(photoId)
        ].source = processedPhoto.toDataURL();
        this.photos[this.getPhotoIndex(photoId)].isLoaded = true;
      }
    } else {
      if (index === 0) {
        this.photos = [{ photoId, source: processedPhoto.src }, ...this.photos];
        this.slideToOne = true;
      } else if (index === 2) {
        this.photos = [...this.photos, { photoId, source: processedPhoto.src }];
      } else {
        this.photos[this.getPhotoIndex(photoId)].source = processedPhoto.src;
        this.photos[this.getPhotoIndex(photoId)].isLoaded = true;
      }
    }
  }

  // iOS(): boolean {
  //   const iDevices = [
  //     'iPad Simulator',
  //     'iPhone Simulator',
  //     'iPod Simulator',
  //     'iPad',
  //     'iPhone',
  //     'iPod'
  //   ];

  //   if (navigator.platform) {
  //     while (iDevices.length) {
  //       if (navigator.platform === iDevices.pop()) {
  //         return true;
  //       }
  //     }
  //   }

  //   return false;
  // }

  async setNextAndPreviousPhoto(photoId: string): Promise<void> {
    this.updateFromSlide = true;
    if (photoId && photoId !== null) {
      const nextAndPreviousPhoto = await PhotosService.getNextAndPreviousPhoto(
        photoId,
        this.albumId
      );
      this.photoId = photoId;
      this.previousPhotoId = nextAndPreviousPhoto.previousId;
      this.nextPhotoId = nextAndPreviousPhoto.nextId;
      let tempPhotos = this.photos;

      if (this.nextPhotoId && !this.photoExist(this.nextPhotoId)) {
        // this.slides.lockSwipes(true);
        tempPhotos = [
          ...tempPhotos,
          { photoId: this.nextPhotoId, isLoaded: false, source: '' }
        ];
        this.getPhoto(this.nextPhotoId, 1);
      }

      if (this.previousPhotoId && !this.photoExist(this.previousPhotoId)) {
        // this.slides.lockSwipes(true);
        this.slideToOne = true;
        tempPhotos = [
          { photoId: this.previousPhotoId, isLoaded: false, source: '' },
          ...tempPhotos
        ];
        this.getPhoto(this.previousPhotoId, 1);
      }
      this.photos = tempPhotos;
    }
  }

  getPhotoIndex(photoId: string): number {
    if (!photoId) {
      return;
    }
    let i: number;
    for (i = 0; i < this.photos.length; i++) {
      if (this.photos[i].photoId === photoId) {
        return i;
      }
    }

    return;
  }

  photoExist(photoId: string) {
    if (!photoId) {
      return false;
    }
    let i: number;
    for (i = 0; i < this.photos.length; i++) {
      if (this.photos[i].photoId === photoId) {
        return true;
      }
    }

    return false;
  }

  async rotatePhoto(): Promise<void> {
    this.rotationInProgress = true;
    const newRotation: number = await PhotosService.rotatePhoto(this.photoId);
    if (!newRotation) {
      this.rotationInProgress = false;
      const metadata = await PhotosService.getPhotoMetaData(this.photoId);
      await this.present.toast(
        'Failed to rotate photo "' + metadata.filename + '".'
      );
    } else {
      this.getPhoto(this.photoId, 1, newRotation);
      this.rotationInProgress = false;

      if (this.updateCallback && typeof this.updateCallback === 'function') {
        // execute the callback, passing parameters as necessary
        this.updateCallback(this.photoId, newRotation);
      }
    }
    AnalyticsService.logEvent('photo-page-rotate');
  }

  async deletePhotoCallback() {
    if (this.updateCallback && typeof this.updateCallback === 'function') {
      // execute the callback, passing parameters as necessary
      this.updateCallback();
    }

    // const deletedIndex: number = await this.slides.getActiveIndex();
    // console.log('deletedIndex', deletedIndex);
    // if (this.nextPhotoId) {
    //   console.log('nextPhotoId', this.nextPhotoId);
    //   // this.photos.filter(item => item.photoId !== this.photos[deletedIndex].photoId);
    //   this.photos.splice(deletedIndex, 1);
    //   await this.setNextAndPreviousPhoto(this.nextPhotoId);
    // } else if (this.previousPhotoId) {
    //   console.log('previousPhotoId', this.previousPhotoId);
    //   // this.photos.filter(item => item.photoId !== this.photos[deletedIndex].photoId);
    //   this.photos.splice(deletedIndex, 1);
    //   // this.garbage += 1;
    //   await this.setNextAndPreviousPhoto(this.previousPhotoId);
    // } else {
    setTimeout(() => {
      this.deleteInProgress = false;
      this.modalController.dismiss();
    }, 1000);
    // }

    AnalyticsService.logEvent('photo-page-delete');
  }

  deletePhotoStartCallback(): void {
    this.deleteInProgress = true;
  }

  async closeModal() {
    await this.modalController.dismiss();
    this.photoId = null;
  }

  async presentAlbumSelector(event: any) {
    const popoverController: any = document.querySelector(
      'ion-popover-controller'
    );

    const popover = await popoverController.create({
      component: 'select-album',
      componentProps: {
        selectedPhotos: [this.photoId],
        startCallback: this.albumSelectorStartCallback.bind(this),
        endCallback: this.albumSelectorEndCallback.bind(this)
      },
      event
    });
    return popover.present();
  }

  albumSelectorStartCallback() {
    this.addToAlbumInProgress = true;
  }

  albumSelectorEndCallback() {
    this.addToAlbumInProgress = false;
  }

  async presentFilterSelector(event: any) {
    const popoverController: any = document.querySelector(
      'ion-popover-controller'
    );

    const popover = await popoverController.create({
      component: 'filter-popover',
      componentProps: {
        selectedPhotos: [this.photoId]
      },
      event,
      backdropDismiss: true,
      showBackdrop: false,
      translucent: true
    });
    return popover.present();
  }

  preventDrag(event: any): boolean {
    event.preventDefault();
    return false;
  }

  async slideDidChange(event: any) {
    event.preventDefault();
    if (this.firstSlide === true) {
      this.firstSlide = false;
      return;
    }

    await this.setNextAndPreviousPhoto(
      this.photos[await this.slides.getActiveIndex()].photoId
    );
  }

  async downloadOriginal(event: MouseEvent): Promise<void> {
    event.preventDefault();
    this.downloadInProgress = true;
    const metadata: PhotoMetadata = await PhotosService.getPhotoMetaData(
      this.photoId,
      null,
      this.decrypt
    );
    const data = await PhotosService.loadPhoto(
      metadata,
      PhotoType.Download,
      false,
      null,
      this.decrypt
    );
    new Downloader({
      url: data,
      filename: metadata.filename
    })
      .then(() => {
        // Called when download ended
        this.downloadInProgress = false;
      })
      .catch((error: any) => {
        // Called when an error occurred
        console.error(error);
        this.downloadInProgress = false;
        this.present.toast('Downloading of the photo failed!');
      });
  }

  async shareOriginal(): Promise<void> {
    this.shareInProgress = true;

    const appConfig = SettingsService.getAppConfig();
    const userSession = new blockstack.UserSession({ appConfig });
    const userData = userSession.loadUserData();
    const shareUrl = `${window.location.protocol}//${window.location.host}/#/shared/${userData.username}/${this.photoId}`;

    if (navigator && navigator.share) {
      await this.shareNative(shareUrl);
    } else {
      await this.shareFallback(shareUrl);
    }

    const metadata: PhotoMetadata = await PhotosService.getPhotoMetaData(
      this.photoId
    );

    const exist: PhotoMetadata = await PhotosService.getPhotoMetaData(
      this.photoId + '-shared',
      null,
      false
    );

    if (!exist) {
      const data = await PhotosService.loadPhoto(metadata, PhotoType.Download);
      if (!data) {
        this.present.toast('Failed to share the photo!');
        // Hide the share actions
        const webSocialShare: any = document.querySelector('web-social-share');
        if (webSocialShare) {
          webSocialShare.show = false;
        }
        return;
      }
      const errorsList = await PhotosService.uploadSharedPhoto(data, metadata);
      this.shareInProgress = false;
      if (errorsList && errorsList.length > 0) {
        for (const error of errorsList) {
          if (error.errorCode === 'err_filesize') {
            this.present.toast(
              'Failed to share "' +
                error.id +
                '", photo exceeds file size limit of 5MB.'
            );
          } else {
            this.present.toast('Failed to share "' + error.id + '".');
          }
        }
      }
    } else {
      this.shareInProgress = false;
    }
  }

  async shareNative(shareUrl: string) {
    return new Promise(async resolve => {
      await navigator.share({
        text: 'Check out my cool photo!',
        url: shareUrl
      });
      resolve();
    });
  }

  shareFallback(shareUrl: string) {
    return new Promise(async resolve => {
      const webSocialShare: any = document.querySelector('web-social-share');
      if (!webSocialShare || !window) {
        return;
      }
      const share = {
        displayNames: true,
        config: [
          {
            twitter: {
              socialShareText: 'Check out my cool photo!',
              socialShareVia: 'Block_Photos',
              socialShareUrl: shareUrl,
              socialSharePopupWidth: 300,
              socialSharePopupHeight: 400
            }
          },
          {
            email: {
              socialShareSubject: 'Check out my cool photo!',
              socialShareBody: shareUrl
            }
          },
          {
            reddit: {
              socialShareText: 'Check out my cool photo!',
              socialShareUrl: shareUrl,
              socialSharePopupWidth: 300,
              socialSharePopupHeight: 500
            }
          },
          {
            whatsapp: {
              socialShareText: 'Check out my cool photo!',
              socialShareUrl: shareUrl
            }
          },
          {
            copy: {
              socialShareUrl: shareUrl
            }
          }
        ]
      };
      // The configuration, set the share options
      webSocialShare.share = share;
      // Show/open the share actions
      webSocialShare.show = true;

      resolve();
    });
  }

  async activateEditor() {
    const popoverController: any = document.querySelector(
      'ion-popover-controller'
    );

    const componentProps = {
      selectedPhotos: [this.photoId],
      deleteCallback: this.delete.bind(this),
      rotateCallback: null
    };

    if (this.decrypt) {
      componentProps.rotateCallback = this.rotatePhoto.bind(this);
    }

    const popover = await popoverController.create({
      component: 'edit-popover',
      componentProps,
      event,
      backdropDismiss: true,
      showBackdrop: false,
      translucent: true
    });
    return popover.present();
  }

  delete() {
    this.present.deletePhotos(
      [this.photoId],
      this.deletePhotoCallback.bind(this),
      this.albumId,
      this.deletePhotoStartCallback.bind(this)
    );
  }

  render() {
    return [
      <web-social-share show={false}>
        <ion-icon
          name="logo-twitter"
          ariaLabel="Twitter"
          slot="twitter"
          color="primary"
          size="large"
        />
        <ion-icon
          name="mail"
          slot="email"
          ariaLabel="Email"
          color="primary"
          size="large"
        />
        <ion-icon
          name="logo-reddit"
          slot="reddit"
          ariaLabel="Email"
          color="primary"
          size="large"
        />
        <ion-icon
          name="logo-whatsapp"
          ariaLabel="WhatsApp"
          slot="whatsapp"
          color="primary"
          size="large"
        />
        <ion-icon
          name="copy"
          ariaLabel="Copy"
          slot="copy"
          color="primary"
          size="large"
        />
      </web-social-share>,
      <ion-header mode="md">
        <ion-toolbar mode="md" color="primary">
          {/* <ion-buttons slot="start">
          </ion-buttons> */}
          {/* <ion-title>Photo</ion-title> */}
          <ion-buttons slot="end">
            <ion-button
              fill="outline"
              color="secondary"
              hidden={!this.decrypt}
              disabled={
                this.deleteInProgress ||
                this.addToAlbumInProgress ||
                this.downloadInProgress ||
                this.rotationInProgress ||
                this.shareInProgress
              }
              onClick={event => this.presentAlbumSelector(event)}
            >
              <ion-label color="light">Albums</ion-label>
              {this.addToAlbumInProgress ? (
                <ion-spinner name="circles" slot="end" color="light" />
              ) : (
                <ion-icon slot="end" color="light" name="add-circle" />
              )}
            </ion-button>
            <ion-button
              fill="outline"
              color="secondary"
              class="ion-hide-sm-down"
              hidden={!this.decrypt}
              disabled={
                this.deleteInProgress ||
                this.addToAlbumInProgress ||
                this.downloadInProgress ||
                this.rotationInProgress ||
                this.shareInProgress
              }
              onClick={() => this.rotatePhoto()}
            >
              <ion-label color="light">Rotate</ion-label>
              {this.rotationInProgress ? (
                <ion-spinner name="circles" slot="end" color="light" />
              ) : (
                <ion-icon slot="end" color="light" name="sync" />
              )}
            </ion-button>
            {/* <ion-button onClick={() => this.presentFilterSelector(event)}>
              <ion-icon color="light" name="color-wand" />
            </ion-button> */}
            <ion-button
              fill="outline"
              color="secondary"
              class="ion-hide-sm-down"
              disabled={
                this.deleteInProgress ||
                this.addToAlbumInProgress ||
                this.downloadInProgress ||
                this.rotationInProgress ||
                this.shareInProgress
              }
              onClick={() => this.delete()}
            >
              <ion-label color="light">Delete</ion-label>
              {this.deleteInProgress ? (
                <ion-spinner name="circles" slot="end" color="light" />
              ) : (
                <ion-icon slot="end" color="light" name="trash" />
              )}
            </ion-button>
            <ion-button
              fill="outline"
              color="secondary"
              class="ion-hide-sm-down"
              hidden={this.isIpad}
              disabled={
                this.deleteInProgress ||
                this.addToAlbumInProgress ||
                this.downloadInProgress ||
                this.rotationInProgress ||
                this.shareInProgress
              }
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
              hidden={!this.decrypt}
              disabled={
                this.deleteInProgress ||
                this.addToAlbumInProgress ||
                this.downloadInProgress ||
                this.rotationInProgress ||
                this.shareInProgress
              }
              onClick={() => this.shareOriginal()}
            >
              <ion-label color="light">Share</ion-label>
              {this.shareInProgress ? (
                <ion-spinner name="circles" slot="end" color="light" />
              ) : (
                <ion-icon slot="end" color="light" name="share" />
              )}
            </ion-button>
            <ion-button
              fill="outline"
              color="secondary"
              class="ion-hide-md-up"
              disabled={
                this.deleteInProgress ||
                this.addToAlbumInProgress ||
                this.downloadInProgress ||
                this.rotationInProgress ||
                this.shareInProgress
              }
              onClick={() => this.activateEditor()}
            >
              <ion-label color="light">Edit</ion-label>
              {this.rotationInProgress || this.deleteInProgress ? (
                <ion-spinner name="circles" slot="end" color="light" />
              ) : (
                <ion-icon slot="end" color="light" name="checkmark-circle" />
              )}
            </ion-button>
            <ion-button
              fill="outline"
              color="secondary"
              disabled={
                this.downloadInProgress ||
                this.deleteInProgress ||
                this.rotationInProgress ||
                this.addToAlbumInProgress ||
                this.shareInProgress
              }
              onClick={() => this.closeModal()}
            >
              <ion-label color="light">Done</ion-label>
            </ion-button>
            {/* <ion-button
              disabled={!this.previousPhotoId}
              onClick={() => this.slides.slidePrev()}
            >
              <ion-icon color="light" name="arrow-back" />
            </ion-button>
            <ion-button
              disabled={!this.nextPhotoId}
              onClick={() => this.slides.slideNext()}
            >
              <ion-icon color="light" name="arrow-forward" />
            </ion-button> */}
          </ion-buttons>
        </ion-toolbar>
      </ion-header>,

      <ion-content scroll-y={false} scroll-x={false} color="dark">
        <ion-slides
          pager={false}
          onIonSlideDidChange={event => this.slideDidChange(event)}
        >
          {this.photos.map(photo => (
            <ion-slide>
              <div
                class={
                  'swiper-zoom-container' +
                  ((photo.isLoaded && this.firstTimeLoaded) || photo.first
                    ? ''
                    : ' hidden')
                }
              >
                <img
                  id={'img-' + photo.photoId}
                  src={photo.source}
                  draggable={false}
                  onDragStart={event => this.preventDrag(event)}
                />
              </div>
              <ion-spinner
                name="circles"
                color="tertiary"
                class={
                  (photo.isLoaded && this.firstTimeLoaded) || photo.first
                    ? 'hidden'
                    : ''
                }
              />
            </ion-slide>
          ))}
        </ion-slides>
      </ion-content>
    ];
  }
}
