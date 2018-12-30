import { Component, Prop, State, Watch } from '@stencil/core';
import PhotosService from '../../services/photos-service';
import PresentingService from '../../services/presenting-service';
import AnalyticsService from '../../services/analytics-service';

declare var blockstack;

@Component({
  tag: 'app-photo'
})
export class AppPhoto {
  private photosService: PhotosService;
  private present: PresentingService;
  private modalController: HTMLIonModalControllerElement;

  @Prop({ mutable: true }) photoId: string;
  @Prop() albumId: string;
  @Prop() updateCallback: any;

  @State() previousPhotoId: string;
  @State() nextPhotoId: string;
  @State() refresh: boolean;

  constructor() {
    this.photosService = new PhotosService();
    this.present = new PresentingService();
  }

  async componentDidLoad() {
    const router = document.querySelector('ion-router');
    await router.componentOnReady();

    // Go to signin page if no active session exist
    if (!blockstack.isUserSignedIn()) {
      router.push('/', 'root');
      return;
    }

    // Go to photos list if photo id is missing
    if (!this.photoId) {
      router.push('/photos', 'root');
      return;
    }

    this.setNextAndPreviousPhoto(this.photoId);

    this.modalController = document.querySelector('ion-modal-controller');
    this.modalController.componentOnReady();

    AnalyticsService.logEvent('photo-page');
  }

  @Watch('photoId')
  photoIdDidUpdate(newValue: string, oldValue: string): void {
    if (newValue && newValue !== oldValue) {
      this.setNextAndPreviousPhoto(this.photoId);
    }
  }

  async setNextAndPreviousPhoto(photoId: string): Promise<void> {
    if (photoId && photoId !== null) {
      const nextAndPreviousPhoto = await this.photosService.getNextAndPreviousPhoto(
        photoId,
        this.albumId
      );
      this.previousPhotoId = nextAndPreviousPhoto.previousId;
      this.nextPhotoId = nextAndPreviousPhoto.nextId;
    }
  }

  async gotoPhotoWithId(photoId: string): Promise<void> {
    if (photoId) {
      this.photoId = photoId;
      this.setNextAndPreviousPhoto(this.photoId);
    }
  }

  async rotatePhoto(): Promise<void> {
    await this.present.loading('Rotating photo...');
    this.photosService.rotatePhoto(
      this.photoId,
      this.rotatePhotoCallback.bind(this)
    );
  }

  async rotatePhotoCallback(
    photoId: string,
    currentIndex: number,
    result: boolean
  ): Promise<void> {
    if (!result) {
      await this.present.dismissLoading();
      const metadata = await this.photosService.getPhotoMetaData(photoId);
      await this.present.toast(
        'Failed to rotate photo "' + metadata.filename + '".'
      );
    } else {
      this.refresh = !this.refresh;

      if (this.updateCallback && typeof this.updateCallback === 'function') {
        // execute the callback, passing parameters as necessary
        this.updateCallback(photoId, currentIndex);
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
      this.gotoPhotoWithId(this.nextPhotoId);
    } else if (this.previousPhotoId) {
      this.gotoPhotoWithId(this.previousPhotoId);
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
    const popoverController = document.querySelector('ion-popover-controller');
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
              onClick={() => this.gotoPhotoWithId(this.previousPhotoId)}
            >
              <ion-icon color="light" name="arrow-back" />
            </ion-button>
            <ion-button
              disabled={!this.nextPhotoId}
              onClick={() => this.gotoPhotoWithId(this.nextPhotoId)}
            >
              <ion-icon color="light" name="arrow-forward" />
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>,

      <ion-content text-center class="photo-page">
        <block-img
          photoId={this.photoId}
          rotate={false}
          refresh={this.refresh}
        />
      </ion-content>
    ];
  }
}
