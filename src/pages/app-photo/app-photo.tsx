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
  @Prop() updateCallback: Function;

  @State() previousPhotoId: string;
  @State() nextPhotoId: string;

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
      if (history) {
        router.push('/photos', 'root');
      }
      return;
    }

    this.setNextAndPreviousPhoto(this.photoId);

    this.modalController = document.querySelector('ion-modal-controller');
    this.modalController.componentOnReady();

    AnalyticsService.logEvent('photo-page');
  }

  @Watch('photoId')
  photoIdDidUpdate(newValue: string, oldValue: string): void {
    if (newValue !== oldValue) {
      this.setNextAndPreviousPhoto(this.photoId);
    }
  }

  async setNextAndPreviousPhoto(photoId: string): Promise<void> {
    if (photoId && photoId !== 'loading') {
        const nextAndPreviousPhoto = await this.photosService.getNextAndPreviousPhoto(photoId);
        this.previousPhotoId = nextAndPreviousPhoto.previousId;
        this.nextPhotoId = nextAndPreviousPhoto.nextId;
        console.log('setnext');
    }
  }

  async gotoPhotoWithId(photoId: string): Promise<void> {
    if (photoId) {
      this.photoId = photoId;
      this.setNextAndPreviousPhoto(this.photoId);
    }
  }

  async rotatePhoto(): Promise<void> {
    await this.photosService.rotatePhoto(this.photoId);

    const tempId = this.photoId;
    this.photoId = 'loading';
    setTimeout(() => {
      this.photoId = tempId;

      if (this.updateCallback && typeof (this.updateCallback) === "function") {
        // execute the callback, passing parameters as necessary

        this.updateCallback(this.photoId);
      }
    }, 500);

    AnalyticsService.logEvent('photo-page-rotate');
  }

  async deletePhotoCallback() {

    if (this.updateCallback && typeof (this.updateCallback) === "function") {
      // execute the callback, passing parameters as necessary

      this.updateCallback();
    }

    if (this.nextPhotoId) {
      this.gotoPhotoWithId(this.nextPhotoId);
    }
    else if(this.previousPhotoId) {
      this.gotoPhotoWithId(this.previousPhotoId);
    } else {
      this.modalController.dismiss();
    }

    AnalyticsService.logEvent('photo-page-delete');
  }

  render() {

    return [
      <ion-header>
        <ion-toolbar mode="md" color="primary">
            <ion-buttons slot="start">
              <ion-button onClick={() => this.modalController.dismiss()}>
                <ion-icon color="light" name="close" size="large"></ion-icon>
              </ion-button>
            </ion-buttons>
            <ion-title>Photo</ion-title>
            <ion-buttons slot="end">
              <ion-button onClick={() => this.rotatePhoto()}>
                <ion-icon color="light" name="sync"></ion-icon>
              </ion-button>
              <ion-button onClick={() => this.present.deletePhoto(this.photoId, this.deletePhotoCallback.bind(this))}>
                <ion-icon color="light" name="trash"></ion-icon>
              </ion-button>
              <ion-button disabled={!this.previousPhotoId} onClick={() => this.gotoPhotoWithId(this.previousPhotoId)}>
                <ion-icon color="light" name="arrow-back"></ion-icon>
              </ion-button>
              <ion-button disabled={!this.nextPhotoId} onClick={() => this.gotoPhotoWithId(this.nextPhotoId)}>
                <ion-icon color="light" name="arrow-forward"></ion-icon>
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
      </ion-header>,

      <ion-content text-center class="photo-page">
        <block-img photoId={this.photoId} rotate={true} />
      </ion-content>
    ];
  }
}
