import { Component, State, Prop } from '@stencil/core';
import PhotosService from '../../services/photos-service';
import PresentingService from '../../services/presenting-service';
import UploadService from '../../services/upload-service';
import AnalyticsService from '../../services/analytics-service';

declare var blockstack;

@Component({
  tag: 'app-photos'
})
export class AppPhotos {

  private timer;
  private lockTimer;
  private touchduration = 800;
  private activatedByTouch = false;
  private photosService: PhotosService;
  private present: PresentingService;
  private uploadService: UploadService;
  private photosRangeListener: any;
  private photosRefresherListener: any;
  private photosLoaded: number;
  private infiniteScroll: any;
  private refresherScroll: any;
  private photosListCached: Array<any> = [];
  private modalController: HTMLIonModalControllerElement;
  private appPhotoElement: HTMLAppPhotoElement;

  @State() photosList: Array<any> = [];
  @State() refreshPhotos: any = {};
  @State() listLoaded: boolean;
  @State() editMode: boolean;
  @State() checkedItems: Array<any> = [];

  @Prop({ mutable: true }) photoId: string;

  constructor() {

    this.photosService = new PhotosService();
    this.present = new PresentingService();
    this.uploadService = new UploadService(this.uploadFilesDoneCallback.bind(this));
    this.photosRangeListener = this.loadPhotosRange.bind(this);
    this.photosRefresherListener = this.refreshPhotosList.bind(this);

  }

  async componentDidLoad() {

    // Go to signin page if no active session exist
    if (!blockstack.isUserSignedIn()) {
      const router = document.querySelector('ion-router');
      await router.componentOnReady();
      router.push('/', 'root');
      return;
    }

    if (this.photoId) {
      this.openPhotoModal(this.photoId);
    }

    this.photosLoaded = 0;

    this.infiniteScroll = document.getElementById('infinite-scroll');
    if (this.infiniteScroll) {
      this.infiniteScroll.addEventListener('ionInfinite', this.photosRangeListener);
    }

    this.refresherScroll = document.getElementById('refresher-scroll');
    if (this.refresherScroll) {
      this.refresherScroll.addEventListener('ionRefresh', this.photosRefresherListener);
    }

    this.uploadService.addEventListeners(true);
    this.loadPhotosList(false);

    this.modalController = document.querySelector('ion-modal-controller');
    this.modalController.componentOnReady();

    // create component to open
    this.appPhotoElement = document.createElement('app-photo');

    AnalyticsService.logEvent('photos-list');
  }

  componentDidUnload() {
    this.uploadService.removeEventListeners(true);
    if (this.infiniteScroll) {
      this.infiniteScroll.removeEventListener('ionInfinite', this.photosRangeListener);
    }
    if (this.refresherScroll) {
      this.refresherScroll.removeEventListener('ionRefresh', this.photosRefresherListener);
    }
  }

  refreshPhotosList() {
    this.loadPhotosList(true, true);
  }

  async loadPhotosList(sync?: boolean, skipLoading?: boolean) {
    try {
      if (!skipLoading) {
        await this.present.loading('Loading photos...');
      }

      // Get the contents of the file picture-list.json
      let photosListResponse = await this.photosService.getPhotosList(sync);
      this.photosListCached = photosListResponse.photosList;
      if (!skipLoading) {
        await this.present.dismissLoading();
      }

      this.loadPhotosRange();

      if (photosListResponse.errorsList && photosListResponse.errorsList.length > 0) {
        for (let error of photosListResponse.errorsList) {
          if (error.errorCode === 'err_cache') {
            this.present.toast('Failed to load cached list. Please try again!');
          } else if (error.errorCode) {
            this.present.toast('Could not load photos from blockstack. Please try again or upload some photos if you have none!');
          }
        }
      }

    } catch (error) {
      if (!skipLoading) {
        await this.present.dismissLoading();
      }
      this.present.toast('Could not load photos. Please try again!');
      this.refresherScroll.complete();
    }
  }

  loadPhotosRange(event?: any) {
    setTimeout(() => {
      if (event) {
        this.infiniteScroll.complete();
      }
      this.refresherScroll.complete();
      const photosToLoad = this.photosLoaded + 18;
      if (photosToLoad > this.photosListCached.length) {
        this.editMode = false;
        this.photosList = this.photosListCached;
        this.listLoaded = true;
        if (event) {
          this.infiniteScroll.disabled = true;
        }
      } else {
        const photosList = this.photosListCached.slice(0, photosToLoad);
        this.editMode = false;
        this.photosList = photosList;
        this.listLoaded = true;
        this.photosLoaded = photosToLoad;
      }
    }, 500);
  }

  async rotatePhotos(): Promise<void> {
    this.refreshPhotos = {};
    for (let id of this.checkedItems) {
      await this.photosService.rotatePhoto(id);

      this.refreshPhotos = { ...this.refreshPhotos, [id]: true };

    }

    AnalyticsService.logEvent('photos-list-rotate');
  }

  uploadFilesDoneCallback() {
    this.loadPhotosList();

    AnalyticsService.logEvent('photos-list-uploaded');
  }

  deletePhotoCallback(): void {
    this.loadPhotosList();

    AnalyticsService.logEvent('photos-list-deleted');
  }

  openFileDialog(event: any): void {
    if (event) {
      event.preventDefault();
    }
    document.getElementById('file-upload').click();

    AnalyticsService.logEvent('photos-list-file-dialog');
  }

  activateEditor(event: any, id?: string, activatedByTouch?: boolean): void {
    this.activatedByTouch = activatedByTouch;
    if (event) {
      event.preventDefault();
    }
    if (id) {
      this.editMode = true;
      this.checkedItems = [id];
    } else {
      this.editMode = true;
      this.checkedItems = [];
    }
  }

  deactivateEditor(): void {
    this.editMode = false;
    this.checkedItems = [];
  }

  async handlePhotoClick(event: any, photoId: string): Promise<void> {
    if (this.editMode) {
      event.preventDefault();
      if (this.lockTimer || this.activatedByTouch) {
        this.activatedByTouch = false;
        return;
      }

      if (this.checkedItems.includes(photoId)) {
        this.checkedItems = this.checkedItems.filter(item => item !== photoId);
      } else {
        this.checkedItems = [...this.checkedItems, photoId];
      }

      if (this.checkedItems.length < 1) {
        this.editMode = false;
      }
    } else {
      this.openPhotoModal(photoId);
    }
  }

  refreshPhoto(photoId: string): void {

    if (this.refreshPhotos[photoId]) {
      this.refreshPhotos = { ...this.refreshPhotos, [photoId]: false };
    } else {
      this.refreshPhotos = { ...this.refreshPhotos, [photoId]: true };
    }
  }

  updateCallback(photoId: string): void {

    if (photoId) {
      setTimeout(() => {
        this.refreshPhoto(photoId);
      }, 1500);
    } else {
      setTimeout(() => {
        this.loadPhotosList(true, true);
      }, 1500);
    }
  }

  async openPhotoModal(photoId: string) {

    await this.present.loading('');
    const modal = await this.modalController.create({
      component: this.appPhotoElement,
      componentProps: {
        photoId: photoId,
        updateCallback: this.updateCallback.bind(this) },
      cssClass: 'router-modal'
    });
    modal.addEventListener('ionModalDidPresent', () => {
      this.present.dismissLoading();
    });
    await modal.present();
  }

  isChecked(id: string): boolean {
    if (this.checkedItems.includes(id)) {
      return true;
    } else {
      return false;
    }
  }

  touchStart(event: any, id: string): void {
    event.preventDefault();
    if (this.lockTimer) {
      return;
    }
    this.timer = setTimeout(() => {
      this.activateEditor(null, id, true);
    }, this.touchduration);
    this.lockTimer = true;
  }

  async touchEnd(): Promise<void> {
    // stops short touches from firing the event
    if (this.timer) {
      clearTimeout(this.timer);
      // clearTimeout, not cleartimeout..
      this.lockTimer = false;
    }
  }

  preventDrag(event: any): boolean {
    event.preventDefault();
    return false;
  }

  render() {

    let rows = [];
    let empty = true;
    if (this.photosList && this.photosList.length > 0) {
      rows = this.chunk(this.photosList, 3);
      empty = false;
    }

    return [
      <ion-header>
        <ion-toolbar mode="md" color="primary">
          <ion-title class="unselectable">Block Photos</ion-title>
          <ion-buttons slot="end">
            {this.editMode ? ([
              <ion-button onClick={() => this.rotatePhotos()}>
                <ion-icon color="light" name="sync"></ion-icon>
              </ion-button>,
              <ion-button onClick={() => this.present.deletePhotos(this.checkedItems, this.deletePhotoCallback.bind(this))}>
                <ion-icon color="light" name="trash"></ion-icon>
              </ion-button>,
              <ion-button onClick={() => this.deactivateEditor()}>
                <ion-icon color="light" name="close"></ion-icon>
              </ion-button>
            ]) : ([
              <ion-button onClick={() => this.loadPhotosList(true)}>
                <ion-icon name="refresh"></ion-icon>
              </ion-button>,
              <ion-button onClick={(event) => this.activateEditor(event, null)}>
                <ion-icon name="checkmark-circle"></ion-icon>
              </ion-button>,
              <ion-button onClick={(event) => this.openFileDialog(event)}>
                <ion-icon name="cloud-upload"></ion-icon>
              </ion-button>
            ])}
          </ion-buttons>
        </ion-toolbar>
      </ion-header>,

      <ion-content id="photos-list">
        <ion-refresher slot="fixed" id="refresher-scroll">
          <ion-refresher-content></ion-refresher-content>
        </ion-refresher>
        {empty && this.listLoaded ? (<ion-card padding text-center><h2>Welcome to Block Photos.</h2><h3>Use the upload button (<ion-icon size="small" name="ios-cloud-upload"></ion-icon>) to add your first photo.</h3></ion-card>) : (
          <ion-grid no-padding>
            {rows.map((row) => (
              <ion-row align-items-center key={row[0].id}>
                {
                  row.map((col) => (
                    <ion-col no-padding align-self-center key={col.id}>
                      <div class="square" draggable={false}
                        onTouchEnd={() => this.touchEnd()}
                        onClick={(event) => this.handlePhotoClick(event, col.id)}
                        onContextMenu={(event) => this.activateEditor(event, col.id)}
                        onDragStart={(event) => this.preventDrag(event)}>
                        {this.editMode ? (<ion-checkbox checked={this.isChecked(col.id)} mode="ios"></ion-checkbox>) : (null)}
                        <block-img photoId={col.id} refresh={this.refreshPhotos[col.id]} />
                      </div>
                    </ion-col>
                  ))
                }
              </ion-row>
            ))}
          </ion-grid>
        )}
        <ion-infinite-scroll threshold="100px" id="infinite-scroll">
          <ion-infinite-scroll-content
            loading-spinner="bubbles"
            loading-text="Loading more photos...">
          </ion-infinite-scroll-content>
        </ion-infinite-scroll>
        <input id="file-upload" type="file" multiple />
      </ion-content>
    ];
  }

  chunk = (input, size) => {
    return input.reduce((arr, item, idx) => {
      return idx % size === 0
        ? [...arr, [item]]
        : [...arr.slice(0, -1), [...arr.slice(-1)[0], item]];
    }, []);
  };
}
