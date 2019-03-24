import { Component, Prop, State } from '@stencil/core';
import loadImage from 'blueimp-load-image';

import PhotosService from '../../services/photos-service';
import PresentingService from '../../services/presenting-service';
import AnalyticsService from '../../services/analytics-service';

declare var blockstack;

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

  @Prop({ mutable: true }) photoId: string;
  @Prop() albumId: string;
  @Prop() updateCallback: any;

  @State() previousPhotoId: string;
  @State() nextPhotoId: string;
  @State() photos: any[];
  @State() isLoaded: boolean;

  constructor() {
    this.photos = [];
    this.present = new PresentingService();
  }

  async componentWillLoad() {
    this.isLoaded = false;
    this.firstSlide = true;
  }

  async componentDidLoad() {
    const router: any = document.querySelector('ion-router');
    await router.componentOnReady();

    // Go to signin page if no active session exist
    const userSession = new blockstack.UserSession();
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
    await this.slides.componentOnReady();
    this.slides.options = {
      zoom: true,
      loop: false
    };

    await this.getPhoto(this.photoId, 2);
    await this.setNextAndPreviousPhoto(this.photoId);

    this.modalController = document.querySelector('ion-modal-controller');
    this.modalController.componentOnReady();

    AnalyticsService.logEvent('photo-page');
  }

  async componentDidUpdate() {
    this.slides.lockSwipes(false);
    if (this.slideToOne) {
      this.slideToOne = false;
      this.firstSlide = true;
      this.slideCorrection(0);
    }
  }

  async slideCorrection(iteration: number) {
    await this.slides.update();
    await this.slides.slideTo(1, 0);
    if ((await this.slides.getActiveIndex()) === 0 && iteration < 100) {
      setTimeout(() => {
        this.slideCorrection(iteration + 1);
      }, 10);
    } else {
      this.isLoaded = true;
    }
  }

  async getPhoto(photoId: string, index: number): Promise<void> {
    let rotation = 1;
    const metadata = await PhotosService.getPhotoMetaData(photoId);

    if (
      metadata &&
      metadata.stats &&
      metadata.stats.exifdata &&
      metadata.stats.exifdata.tags.Orientation
    ) {
      rotation = metadata.stats.exifdata.tags.Orientation;
      // Handle correct orientation for iOS
      if (this.iOS() && metadata.stats.exifdata.tags.OriginalOrientation) {
        const originalOrientation =
          metadata.stats.exifdata.tags.OriginalOrientation;
        // If the orientation is unchanged don't rotate at all with CSS, iOS handles it automatic
        if (rotation === originalOrientation) {
          rotation = 1;
        } else if (rotation === 1 && originalOrientation === 6) {
          rotation = 8;
        } else if (rotation === 1) {
          rotation = originalOrientation;
        } else if (rotation === 3 && originalOrientation === 6) {
          rotation = 6;
        } else if (rotation === 8 && originalOrientation === 6) {
          rotation = 3;
        } else if (rotation === 3 && originalOrientation === 8) {
          rotation = 6;
        } else if (rotation === 6 && originalOrientation === 8) {
          rotation = 3;
        } else if (rotation === 8 && originalOrientation === 3) {
          rotation = 6;
        } else if (rotation === 6 && originalOrientation === 3) {
          rotation = 8;
        }
      }
    }

    if (
      rotation !== 1 &&
      metadata &&
      metadata.stats &&
      metadata.stats.exifdata &&
      metadata.stats.exifdata.tags.Orientation
    ) {
      const imageOptions = {
        orientation: metadata.stats.exifdata.tags.Orientation
      };
      loadImage(
        await PhotosService.loadPhoto(photoId),
        processedPhoto => {
          this.handleProcessedPhoto(processedPhoto, index, photoId);
        },
        imageOptions
      );
    } else {
      if (index === 0) {
        this.photos = [
          { photoId, source: await PhotosService.loadPhoto(photoId) },
          ...this.photos
        ];
        this.slideToOne = true;
      } else if (index === 2) {
        this.photos = [
          ...this.photos,
          { photoId, source: await PhotosService.loadPhoto(photoId) }
        ];
      }
    }
  }

  handleProcessedPhoto(
    processedPhoto: any,
    index: number,
    photoId: string
  ): void {
    if (processedPhoto.type === 'error') {
      // TODO: show error message
    } else if (processedPhoto.tagName === 'CANVAS') {
      if (index === 0) {
        this.photos = [
          { photoId, source: processedPhoto.toDataURL() },
          ...this.photos
        ];
        this.slideToOne = true;
      } else if (index === 2) {
        this.photos = [
          ...this.photos,
          { photoId, source: processedPhoto.toDataURL() }
        ];
      }
    } else {
      if (index === 0) {
        this.photos = [{ photoId, source: processedPhoto.src }, ...this.photos];
        this.slideToOne = true;
      } else if (index === 2) {
        this.photos = [...this.photos, { photoId, source: processedPhoto.src }];
      }
    }
  }

  iOS(): boolean {
    const iDevices = [
      'iPad Simulator',
      'iPhone Simulator',
      'iPod Simulator',
      'iPad',
      'iPhone',
      'iPod'
    ];

    if (navigator.platform) {
      while (iDevices.length) {
        if (navigator.platform === iDevices.pop()) {
          return true;
        }
      }
    }

    return false;
  }

  async setNextAndPreviousPhoto(photoId: string): Promise<void> {
    if (photoId && photoId !== null) {
      const nextAndPreviousPhoto = await PhotosService.getNextAndPreviousPhoto(
        photoId,
        this.albumId
      );
      this.photoId = photoId;
      this.previousPhotoId = nextAndPreviousPhoto.previousId;
      this.nextPhotoId = nextAndPreviousPhoto.nextId;

      if (
        ((await this.slides.getActiveIndex()) === this.photos.length - 1 ||
          this.photos.length < 2) &&
        this.nextPhotoId &&
        !this.photoExist(this.nextPhotoId)
      ) {
        this.slides.lockSwipes(true);
        await this.getPhoto(this.nextPhotoId, 2);
      }

      if (
        (await this.slides.getActiveIndex()) === 0 &&
        this.previousPhotoId &&
        !this.photoExist(this.previousPhotoId)
      ) {
        this.slides.lockSwipes(true);
        await this.getPhoto(this.previousPhotoId, 0);
      }
    }
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
    await this.present.loading('Rotating photo...');
    const result = await PhotosService.rotatePhoto(this.photoId);
    if (!result) {
      await this.present.dismissLoading();
      const metadata = await PhotosService.getPhotoMetaData(this.photoId);
      await this.present.toast(
        'Failed to rotate photo "' + metadata.filename + '".'
      );
    } else {
      // TODO: this.refresh = !this.refresh;

      if (this.updateCallback && typeof this.updateCallback === 'function') {
        // execute the callback, passing parameters as necessary
        this.updateCallback(this.photoId);
      }

      this.present.dismissLoading();
    }
    AnalyticsService.logEvent('photo-page-rotate');
  }

  async deletePhotoCallback() {
    if (this.updateCallback && typeof this.updateCallback === 'function') {
      // execute the callback, passing parameters as necessary

      this.updateCallback();
    }

    if (this.nextPhotoId) {
      this.slides.slideNext();
    } else if (this.previousPhotoId) {
      this.slides.slidePrev();
    } else {
      this.modalController.dismiss();
    }

    AnalyticsService.logEvent('photo-page-delete');
  }

  async closeModal() {
    await this.modalController.dismiss();
    this.photoId = null;
  }

  async presentAlbumSelector(event: any) {
    const popoverController: any = document.querySelector(
      'ion-popover-controller'
    );
    await popoverController.componentOnReady();

    const popover = await popoverController.create({
      component: 'select-album',
      componentProps: {
        selectedPhotos: [this.photoId]
      },
      event
    });
    return popover.present();
  }

  photoLoaded() {
    this.isLoaded = true;
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

    if (
      (await this.slides.getPreviousIndex()) >
      (await this.slides.getActiveIndex())
    ) {
      // console.log('left swipe');
      await this.setNextAndPreviousPhoto(this.previousPhotoId);
    } else {
      // console.log('right swipe');
      await this.setNextAndPreviousPhoto(this.nextPhotoId);
    }
  }

  render() {
    return [
      <ion-header>
        <ion-toolbar mode="md" color="primary">
          <ion-buttons slot="start">
            <ion-button onClick={() => this.closeModal()}>
              <ion-icon color="light" name="close" size="large" />
            </ion-button>
          </ion-buttons>
          <ion-title>Photo</ion-title>
          <ion-buttons slot="end">
            <ion-button onClick={event => this.presentAlbumSelector(event)}>
              <ion-icon color="light" name="add-circle" />
            </ion-button>
            <ion-button onClick={() => this.rotatePhoto()}>
              <ion-icon color="light" name="sync" />
            </ion-button>
            <ion-button
              onClick={() =>
                this.present.deletePhotos(
                  [this.photoId],
                  this.deletePhotoCallback.bind(this),
                  this.albumId
                )
              }
            >
              <ion-icon color="light" name="trash" />
            </ion-button>
            <ion-button
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
            </ion-button>
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
                  'swiper-zoom-container' + (this.isLoaded ? '' : ' hidden')
                }
              >
                <img
                  src={photo.source}
                  draggable={false}
                  onDragStart={event => this.preventDrag(event)}
                />
              </div>
              <ion-spinner
                name="circles"
                color="tertiary"
                class={this.isLoaded ? 'hidden' : ''}
              />
            </ion-slide>
          ))}
        </ion-slides>
      </ion-content>
    ];
  }
}
