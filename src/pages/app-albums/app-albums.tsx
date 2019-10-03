import { Component, State, h } from '@stencil/core';

import AlbumsService from '../../services/albums-service';
import AnalyticsService from '../../services/analytics-service';
import StorageService from '../../services/storage-service';
import PresentingService from '../../services/presenting-service';
import { PhotoType } from '../../models/photo-type';
import SettingsService from '../../services/settings-service';
// import * as blockstack from 'blockstack';
declare var blockstack;

@Component({
  tag: 'app-albums'
})
export class AppAlbums {
  private present: PresentingService;
  private refresherScroll: any;
  private timestampChecker: any;

  @State() albums: any[] = [];
  @State() albumsLoaded: boolean;
  @State() editMode: boolean;

  constructor() {
    this.present = new PresentingService();
  }

  componentWillLoad() {
    this.albumsLoaded = false;
    this.editMode = false;
  }

  async componentDidLoad() {
    // Go to signin page if no active session exist
    const appConfig = SettingsService.getAppConfig();
    const userSession = new blockstack.UserSession({ appConfig });
    if (!userSession.isUserSignedIn()) {
      const router: any = document.querySelector('ion-router');
      await router.componentOnReady();
      router.push('/', 'root');
      return;
    }
    this.refresherScroll = document.getElementById('albums-refresher-scroll');

    this.loadAlbums(false);

    this.timestampChecker = setInterval(
      this.checkTimestampUpdate.bind(this),
      10000
    );

    AnalyticsService.logEvent('photos-list');
  }

  async componentDidUnload() {
    clearInterval(this.timestampChecker);
  }

  async checkTimestampUpdate() {
    if (!this.editMode) {
      if (await StorageService.checkUpdatedTimestamp()) {
        this.loadAlbums(true, false);
      }
    }
  }

  refreshList() {
    this.loadAlbums(true, false);
  }

  async loadAlbums(sync?: boolean, loader = true) {
    try {
      if (loader) {
        await this.present.loading('Loading albums...');
      }
      const albumsResponse = await AlbumsService.getAlbums(sync);
      this.albums = albumsResponse.albums;

      if (loader) {
        await this.present.dismissLoading();
      }
      this.albumsLoaded = true;

      this.handleAlbumErrors(albumsResponse);
      this.refresherScroll.complete();
    } catch (error) {
      if (loader) {
        await this.present.dismissLoading();
      }
      this.albumsLoaded = true;
      this.present.toast('Could not load albums. Please try again!');
      this.refresherScroll.complete();
    }
  }

  private handleAlbumErrors(albumsResponse: any) {
    if (albumsResponse.errorsList && albumsResponse.errorsList.length > 0) {
      for (const error of albumsResponse.errorsList) {
        if (error.errorCode === 'err_cache') {
          this.present.toast('Failed to load local albums. Please try again!');
        } else if (error.errorCode) {
          this.present.toast(
            'Could not load albums from blockstack. Please try again or create some albums if you have none!'
          );
        }
      }
    }
  }

  async presentCreateAlbumPrompt() {
    const alertController: any = document.querySelector('ion-alert-controller');

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
          handler: async album => {
            try {
              const albumsResponse = await AlbumsService.createAlbum(
                album.albumName
              );
              this.albums = albumsResponse.albums;
              this.albumsLoaded = true;

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

  activateEditor(event: any): void {
    if (event) {
      event.preventDefault();
    }

    this.editMode = true;
  }

  deactivateEditor(): void {
    this.editMode = false;
  }

  async updateAlbumName(event: any, albumId: string, albumName: string) {
    if (albumName !== event.target.value) {
      try {
        const albumsResponse = await AlbumsService.updateAlbumName(
          albumId,
          event.target.value
        );

        if (albumsResponse) {
          this.albums = albumsResponse;
          this.albumsLoaded = true;
        } else {
          throw new Error('error');
        }
      } catch (error) {
        this.present.toast('Could not update album. Please try again!');
      }
    }
  }

  async deleteAlbum(albumId: string, albumName: string): Promise<void> {
    const actionSheetController: any = document.querySelector(
      'ion-action-sheet-controller'
    );

    const actionSheet = await actionSheetController.create({
      header: 'Delete the album "' + albumName + '"?',
      buttons: [
        {
          text: 'Delete',
          role: 'destructive',
          icon: 'trash',
          handler: () => {
            this.deleteCallback(albumId);
          }
        },
        {
          text: 'Cancel',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  async deleteCallback(albumId: string) {
    try {
      this.present.loading('Deleting album...');
      const albumsResponse = await AlbumsService.deleteAlbum(albumId);
      await this.present.dismissLoading();

      if (albumsResponse) {
        this.albums = albumsResponse;
        this.albumsLoaded = true;
      } else {
        throw new Error('error');
      }
    } catch (error) {
      this.present.toast(
        'The removal of the album failed. Please try again in a few minutes!'
      );
    }
  }

  async openAlbum(event: any, albumId: string) {
    event.preventDefault();

    if (!this.editMode) {
      const router: any = document.querySelector('ion-router');
      router.push('/album/' + albumId, 'forward');
    }
  }

  preventDrag(event: any): boolean {
    event.preventDefault();
    return false;
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
        <ion-toolbar mode="md" color="primary">
          <ion-title class="unselectable">Albums</ion-title>
          <ion-buttons slot="end">
            {this.editMode
              ? [
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
                    onClick={() => this.loadAlbums(true)}
                  >
                    <ion-label color="light">Refresh</ion-label>
                    <ion-icon slot="end" color="light" name="refresh" />
                  </ion-button>,
                  <ion-button
                    fill="outline"
                    color="secondary"
                    onClick={event => this.activateEditor(event)}
                  >
                    <ion-label color="light">Edit</ion-label>
                    <ion-icon
                      slot="end"
                      color="light"
                      name="create"
                      mode="md"
                    />
                  </ion-button>,
                  <ion-button
                    fill="outline"
                    color="secondary"
                    onClick={() => this.presentCreateAlbumPrompt()}
                  >
                    <ion-label color="light">Create</ion-label>
                    <ion-icon slot="end" color="light" name="add-circle" />
                  </ion-button>
                ]}
            {!this.editMode ? (
              <ion-menu-toggle>
                <ion-button fill="outline" color="secondary">
                  <ion-label color="light">Menu</ion-label>
                </ion-button>
              </ion-menu-toggle>
            ) : null}
          </ion-buttons>
        </ion-toolbar>
      </ion-header>,

      <ion-content>
        <ion-refresher
          slot="fixed"
          id="albums-refresher-scroll"
          onIonRefresh={() => this.refreshList()}
        >
          <ion-refresher-content />
        </ion-refresher>
        {empty && this.albumsLoaded ? (
          <ion-card
            mode="md"
            class="pointer"
            text-center
            onClick={() => this.presentCreateAlbumPrompt()}
          >
            <h2>Albums</h2>
            <h3>Click here to create your first album.</h3>
            <ion-icon class="cloud-icon" size="large" name="add-circle" />
          </ion-card>
        ) : (
          <ion-grid no-padding>
            {rows.map(row => (
              <ion-row align-items-center key={row[0].albumId}>
                {row.map(col => (
                  <ion-col no-padding align-self-center key={col.albumId}>
                    <ion-card
                      color="primary"
                      class={this.editMode ? '' : 'pointer'}
                      onClick={event => this.openAlbum(event, col.albumId)}
                    >
                      <ion-card-header no-padding>
                        <div class="square">
                          {col.thumbnailId ? (
                            <block-img
                              photoId={col.thumbnailId}
                              rotate={false}
                              phototType={PhotoType.Thumbnail}
                            />
                          ) : (
                            <ion-img
                              draggable={false}
                              src="/assets/placeholder-image.jpg"
                              onDragStart={event => this.preventDrag(event)}
                            />
                          )}
                          {this.editMode ? (
                            <ion-button
                              no-padding
                              size="small"
                              shape="round"
                              fill="clear"
                              class="floatIcon"
                              onClick={() =>
                                this.deleteAlbum(col.albumId, col.albumName)
                              }
                            >
                              <ion-icon
                                slot="icon-only"
                                color="danger"
                                name="remove-circle"
                              />
                            </ion-button>
                          ) : null}
                        </div>
                      </ion-card-header>
                      <ion-card-content
                        mode="md"
                        margin-top
                        class="unselectable"
                      >
                        {this.editMode ? (
                          <ion-item color="secondary">
                            <ion-input
                              no-padding
                              no-margin
                              type="text"
                              value={col.albumName}
                              onIonBlur={event =>
                                this.updateAlbumName(
                                  event,
                                  col.albumId,
                                  col.albumName
                                )
                              }
                            />
                          </ion-item>
                        ) : (
                          col.albumName
                        )}
                      </ion-card-content>
                    </ion-card>
                  </ion-col>
                ))}
                {row.length === 1 ? <ion-col /> : null}
              </ion-row>
            ))}
          </ion-grid>
        )}
      </ion-content>
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
