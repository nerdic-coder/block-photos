import { Component, Prop, State } from '@stencil/core';

import AlbumsService from '../../services/albums-service';
import PhotosService from '../../services/photos-service';
import PresentingService from '../../services/presenting-service';
import UploadService from '../../services/upload-service';
import AnalyticsService from '../../services/analytics-service';
import { PhotoType } from '../../models/photo-type';

declare var blockstack;

@Component({
  tag: 'app-photos',
  styleUrl: 'app-photos.css'
})
export class AppPhotos {
  private timer;
  private lockTimer;
  private touchduration = 800;
  private activatedByTouch = false;
  private present: PresentingService;
  private uploadService: UploadService;
  private ionRouteDidChangeListener: any;
  private photosLoaded: number;
  private infiniteScroll: any;
  private refresherScroll: any;
  private photosListCached: any[] = [];
  private modalController: HTMLIonModalControllerElement;
  private appPhotoElement: HTMLAppPhotoElement;
  private album: any;
  private router: HTMLIonRouterElement;

  @State() photosList: any[] = [];
  @State() refreshPhotos: any = {};
  @State() listLoaded: boolean;
  @State() editMode: boolean;
  @State() checkedItems: any[] = [];
  @State() uploadInProgress: boolean;

  @Prop({ mutable: true }) photoId: string;
  @Prop({ mutable: true }) albumId: string;

  constructor() {
    this.present = new PresentingService();
    this.ionRouteDidChangeListener = this.ionRouteDidChange.bind(this);
  }

  async componentWillLoad() {
    this.uploadService = new UploadService(
      this.uploadFilesDoneCallback.bind(this),
      this.albumId,
      this.uploadFilesStartedCallback.bind(this)
    );

    if (this.albumId) {
      // Load album list
      this.album = await AlbumsService.getAlbumMetaData(this.albumId);
    }
  }

  async componentDidLoad() {
    this.router = document.querySelector('ion-router');
    await this.router.componentOnReady();
    // Go to signin page if no active session exist
    const userSession = new blockstack.UserSession();
    if (!userSession.isUserSignedIn()) {
      this.router.push('/', 'root');
      return;
    }

    this.router.addEventListener(
      'ionRouteDidChange',
      this.ionRouteDidChangeListener
    );

    if (this.photoId) {
      this.openPhotoModal(this.photoId);
    }

    this.photosLoaded = 0;

    this.infiniteScroll = document.getElementById('infinite-scroll');
    this.refresherScroll = document.getElementById('photos-refresher-scroll');
    this.uploadService.addEventListeners(true);
    this.loadPhotosList(false);

    this.modalController = document.querySelector('ion-modal-controller');
    this.modalController.componentOnReady();

    AnalyticsService.logEvent('photos-list');
  }

  async componentDidUnload() {
    this.uploadService.removeEventListeners(true);
    this.router.removeEventListener(
      'ionRouteDidChange',
      this.ionRouteDidChangeListener
    );
  }

  ionRouteDidChange(event: any) {
    if (event && event.detail && event.detail.to === '/photos') {
      this.albumId = null;
      this.album = null;
      this.refreshPhotosList();
    }
  }

  refreshPhotosList() {
    this.loadPhotosList(true, true);
  }

  async loadPhotosList(sync?: boolean, skipLoading?: boolean) {
    try {
      if (!skipLoading) {
        await this.present.presentToolbarLoader('Loading photos...');
      }

      // Get the contents of the file picture-list.json
      const photosListResponse = await PhotosService.getPhotosList(
        sync,
        this.albumId
      );
      this.photosListCached = photosListResponse.photosList;
      if (!skipLoading) {
        this.present.dismissToolbarLoader();
      }

      this.loadPhotosRange();

      if (
        photosListResponse.errorsList &&
        photosListResponse.errorsList.length > 0
      ) {
        for (const error of photosListResponse.errorsList) {
          if (error.errorCode === 'err_cache') {
            this.present.toast('Failed to load cached list. Please try again!');
          } else if (error.errorCode) {
            this.present.toast(
              'Could not load photos from blockstack. Please try again or upload some photos if you have none!'
            );
          }
        }
      }
    } catch (error) {
      console.error('loadPhotosList error', error);
      if (!skipLoading) {
        this.present.dismissToolbarLoader();
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
      if (photosToLoad >= this.photosListCached.length) {
        // this.refresherScroll.disabled = false;
        // this.editMode = false;
        this.photosList = this.photosListCached;
        this.listLoaded = true;
        this.infiniteScroll.disabled = true;
      } else {
        const photosList = this.photosListCached.slice(0, photosToLoad);
        // this.editMode = false;
        this.photosList = photosList;
        this.listLoaded = true;
        this.photosLoaded = photosToLoad;
      }
    }, 500);
  }

  async rotatePhotos(): Promise<void> {
    this.refreshPhotos = {};
    for (const photoId of this.checkedItems) {
      const result = await PhotosService.rotatePhoto(photoId);
      if (!result) {
        const metadata = await PhotosService.getPhotoMetaData(photoId);
        await this.present.toast(
          'Failed to rotate photo "' + metadata.filename + '".'
        );
      } else {
        this.refreshPhotos = { ...this.refreshPhotos, [photoId]: true };
      }
    }

    AnalyticsService.logEvent('photos-list-rotate');
  }

  uploadFilesDoneCallback() {
    this.uploadInProgress = false;
    this.loadPhotosList();

    AnalyticsService.logEvent('photos-list-uploaded');
  }

  uploadFilesStartedCallback() {
    this.uploadInProgress = true;
  }

  deletePhotoCallback(): void {
    this.checkedItems = [];
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

    this.refresherScroll.disabled = true;
    this.editMode = true;
    this.checkedItems = id ? [id] : [];
  }

  deactivateEditor(): void {
    this.refresherScroll.disabled = false;
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

      this.checkedItems = this.checkedItems.includes(photoId)
        ? this.checkedItems.filter(item => item !== photoId)
        : (this.checkedItems = [...this.checkedItems, photoId]);
    } else {
      this.openPhotoModal(photoId);
    }
  }

  refreshPhoto(photoId: string): void {
    this.refreshPhotos = this.refreshPhotos[photoId]
      ? (this.refreshPhotos = { ...this.refreshPhotos, [photoId]: false })
      : (this.refreshPhotos = { ...this.refreshPhotos, [photoId]: true });
  }

  updateCallback(photoId: string): void {
    if (photoId) {
      this.refreshPhoto(photoId);
    } else {
      setTimeout(() => {
        this.loadPhotosList(true, true);
      }, 1500);
    }
  }

  async openPhotoModal(photoId: string) {
    if (this.appPhotoElement) {
      this.appPhotoElement.remove();
    }
    // create component to open
    this.appPhotoElement = document.createElement('app-photo');

    const modal = await this.modalController.create({
      component: this.appPhotoElement,
      componentProps: {
        photoId,
        albumId: this.albumId,
        updateCallback: this.updateCallback.bind(this)
      },
      cssClass: 'router-modal'
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

  async presentAlbumSelector(event: any) {
    const popoverController: any = document.querySelector(
      'ion-popover-controller'
    );
    await popoverController.componentOnReady();

    const popover = await popoverController.create({
      component: 'select-album',
      componentProps: {
        selectedPhotos: this.checkedItems
      },
      event
    });
    return popover.present();
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
          {this.album && !this.editMode ? (
            <ion-buttons slot="start">
              <ion-back-button defaultHref="/albums" />
            </ion-buttons>
          ) : null}
          {this.editMode ? (
            ''
          ) : (
            <ion-title class="unselectable">
              {this.album ? this.album.albumName : 'Photos'}
            </ion-title>
          )}
          <ion-buttons slot="end">
            {this.editMode
              ? [
                  <ion-button
                    fill="outline"
                    color="secondary"
                    disabled={this.checkedItems.length === 0}
                    onClick={event => this.presentAlbumSelector(event)}
                  >
                    <ion-label color="light">Albums</ion-label>
                    <ion-icon slot="end" color="light" name="add-circle" />
                  </ion-button>,
                  <ion-button
                    fill="outline"
                    color="secondary"
                    onClick={() => this.rotatePhotos()}
                    disabled={this.checkedItems.length === 0}
                  >
                    <ion-label color="light">Rotate</ion-label>
                    <ion-icon slot="end" color="light" name="sync" />
                  </ion-button>,
                  <ion-button
                    fill="outline"
                    color="secondary"
                    disabled={this.checkedItems.length === 0}
                    onClick={() =>
                      this.present.deletePhotos(
                        this.checkedItems,
                        this.deletePhotoCallback.bind(this),
                        this.albumId
                      )
                    }
                  >
                    <ion-label color="light">Delete</ion-label>
                    <ion-icon slot="end" color="light" name="trash" />
                  </ion-button>,
                  <ion-button
                    fill="outline"
                    color="secondary"
                    onClick={() => this.deactivateEditor()}
                  >
                    <ion-label color="light">Done</ion-label>
                  </ion-button>
                ]
              : [
                  <ion-button
                    class="ion-hide-sm-down"
                    fill="outline"
                    color="secondary"
                    onClick={() => this.loadPhotosList(true)}
                  >
                    <ion-label color="light">Refresh</ion-label>
                    <ion-icon slot="end" color="light" name="refresh" />
                  </ion-button>,
                  <ion-button
                    fill="outline"
                    color="secondary"
                    disabled={this.uploadInProgress === true}
                    onClick={event => this.activateEditor(event, null)}
                  >
                    <ion-label color="light">Edit</ion-label>
                    <ion-icon
                      slot="end"
                      color="light"
                      name="checkmark-circle"
                    />
                  </ion-button>,
                  <ion-button
                    fill="outline"
                    color="secondary"
                    disabled={this.uploadInProgress === true}
                    onClick={event => this.openFileDialog(event)}
                  >
                    <ion-label color="light">Upload</ion-label>
                    <ion-icon slot="end" color="light" name="cloud-upload" />
                  </ion-button>
                ]}
            {!this.editMode && !this.album ? <ion-menu-button /> : null}
          </ion-buttons>
        </ion-toolbar>
        <ion-toolbar class="loadingToolbar">
          <ion-progress-bar type="indeterminate" />
          <ion-title />
        </ion-toolbar>
      </ion-header>,

      <ion-content id="photos-list">
        <ion-refresher
          slot="fixed"
          id="photos-refresher-scroll"
          onIonRefresh={() => this.refreshPhotosList()}
        >
          <ion-refresher-content />
        </ion-refresher>
        {empty && this.listLoaded ? (
          <ion-card
            padding
            text-center
            class="pointer ion-align-items-center"
            onClick={event => this.openFileDialog(event)}
          >
            <ion-grid class="upload-grid">
              <ion-row>
                <ion-col align-self-center>
                  {!this.album ? <h2>Welcome to Block Photos.</h2> : null}
                  <h3>Click here to upload your first photo.</h3>
                  <ion-icon
                    class="cloud-icon"
                    size="large"
                    name="cloud-upload"
                  />
                </ion-col>
              </ion-row>
            </ion-grid>
          </ion-card>
        ) : (
          <ion-grid no-padding>
            {rows.map(row => (
              <ion-row align-items-stretch key={row[0].id}>
                {row.map(col => (
                  <ion-col
                    no-padding
                    align-self-center
                    key={col.id}
                    class={this.isChecked(col.id) ? 'selected' : ''}
                  >
                    {/* <ion-checkbox
                      class="floatInput"
                      checked={this.isChecked(col.id)}
                      disabled={!this.editMode}
                      mode="ios"
                    /> */}
                    <div
                      class="square pointer"
                      draggable={false}
                      onTouchEnd={() => this.touchEnd()}
                      onClick={event => this.handlePhotoClick(event, col.id)}
                      onContextMenu={event =>
                        this.activateEditor(event, col.id)
                      }
                      onDragStart={event => this.preventDrag(event)}
                    >
                      <block-img
                        photoId={col.id}
                        phototType={PhotoType.Thumbnail}
                        refresh={this.refreshPhotos[col.id]}
                      />
                    </div>
                  </ion-col>
                ))}
                {row.length === 1
                  ? [
                      <ion-col no-padding align-self-stretch>
                        {this.editMode ? (
                          ''
                        ) : (
                          <ion-card
                            no-margin
                            text-center
                            class="pointer full"
                            onClick={event => this.openFileDialog(event)}
                          >
                            <ion-grid class="upload-grid">
                              <ion-row>
                                <ion-col align-self-center>
                                  <h3>Click here to upload more photos.</h3>
                                  <ion-icon
                                    class="cloud-icon"
                                    size="large"
                                    name="cloud-upload"
                                  />
                                </ion-col>
                              </ion-row>
                            </ion-grid>
                          </ion-card>
                        )}
                      </ion-col>,
                      <ion-col />
                    ]
                  : null}
                {row.length === 2
                  ? [
                      <ion-col no-padding align-self-stretch>
                        {this.editMode ? (
                          ''
                        ) : (
                          <ion-card
                            no-margin
                            text-center
                            class="pointer full"
                            onClick={event => this.openFileDialog(event)}
                          >
                            <ion-grid class="upload-grid">
                              <ion-row>
                                <ion-col align-self-center>
                                  <h3>Click here to upload more photos.</h3>
                                  <ion-icon
                                    class="cloud-icon"
                                    size="large"
                                    name="cloud-upload"
                                  />
                                </ion-col>
                              </ion-row>
                            </ion-grid>
                          </ion-card>
                        )}
                      </ion-col>
                    ]
                  : null}
              </ion-row>
            ))}
          </ion-grid>
        )}
        <ion-infinite-scroll
          threshold="100px"
          id="infinite-scroll"
          onIonInfinite={event => this.loadPhotosRange(event)}
        >
          <ion-infinite-scroll-content
            loading-spinner="bubbles"
            loading-text="Loading more photos..."
          />
        </ion-infinite-scroll>
        <input id="file-upload" type="file" multiple />
      </ion-content>,
      <div>
        {this.editMode ? (
          <ion-footer>
            <ion-toolbar>
              <ion-title>{this.checkedItems.length} Photos Selected</ion-title>
            </ion-toolbar>
          </ion-footer>
        ) : null}
      </div>
    ];
  }

  chunk(input: any, size: number): any {
    return input.reduce((arr, item, idx) => {
      return idx % size === 0
        ? [...arr, [item]]
        : [...arr.slice(0, -1), [...arr.slice(-1)[0], item]];
    }, []);
  }
}
