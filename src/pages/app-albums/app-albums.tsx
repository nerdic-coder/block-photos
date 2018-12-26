import { Component, State } from '@stencil/core';

import AlbumsService from '../../services/albums-service';
import AnalyticsService from '../../services/analytics-service';
import PresentingService from '../../services/presenting-service';

declare var blockstack;

@Component({
  tag: 'app-albums'
})
export class AppAlbums {
  private albumsService: AlbumsService;
  private present: PresentingService;

  @State() albums: any[] = [];
  @State() albumsLoaded: boolean;
  @State() editMode: boolean;

  constructor() {
    this.albumsService = new AlbumsService();
    this.present = new PresentingService();
  }

  componentWillLoad() {
    this.albumsLoaded = false;
    this.editMode = false;
  }

  async componentDidLoad() {
    // Go to signin page if no active session exist
    if (!blockstack.isUserSignedIn()) {
      const router = document.querySelector('ion-router');
      await router.componentOnReady();
      router.push('/', 'root');
      return;
    }

    this.loadAlbums(false);

    AnalyticsService.logEvent('photos-list');
  }

  async loadAlbums(sync?: boolean) {
    try {
      await this.present.loading('Loading albums...');

      const albumsResponse = await this.albumsService.getAlbums(sync);
      this.albums = albumsResponse.albums;

      await this.present.dismissLoading();
      this.albumsLoaded = true;

      this.handleAlbumErrors(albumsResponse);
    } catch (error) {
      await this.present.dismissLoading();
      this.albumsLoaded = true;

      this.present.toast('Could not load albums. Please try again!');
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
          handler: async album => {
            try {
              const albumsResponse = await this.albumsService.createAlbum(
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
        const albumsResponse = await this.albumsService.updateAlbumName(
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
    const actionSheetController = document.querySelector(
      'ion-action-sheet-controller'
    );
    await actionSheetController.componentOnReady();

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
      const albumsResponse = await this.albumsService.deleteAlbum(albumId);
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
      const router = document.querySelector('ion-router');
      await router.componentOnReady();
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
        <ion-toolbar color="primary">
          <ion-title>Albums</ion-title>
          <ion-buttons slot="end">
            {this.editMode
              ? [
                  <ion-button onClick={() => this.deactivateEditor()}>
                    <ion-icon color="light" name="close" />
                  </ion-button>
                ]
              : [
                  <ion-button onClick={event => this.activateEditor(event)}>
                    <ion-icon name="create" mode="md" />
                  </ion-button>,
                  <ion-button onClick={() => this.presentCreateAlbumPrompt()}>
                    <ion-icon name="add-circle" />
                  </ion-button>
                ]}
            <ion-menu-button />
          </ion-buttons>
        </ion-toolbar>
      </ion-header>,

      <ion-content>
        {empty && this.albumsLoaded ? (
          <ion-card padding text-center>
            <h2>Welcome to Block Photos albums section.</h2>
            <h3>
              Use the add button (<ion-icon size="small" name="add-circle" />)
              to add your first photo.
            </h3>
          </ion-card>
        ) : (
          <ion-grid no-padding>
            {rows.map(row => (
              <ion-row align-items-center key={row[0].albumId}>
                {row.map(col => (
                  <ion-col no-padding align-self-stretch key={col.albumId}>
                    <ion-card
                      class={this.editMode ? '' : 'pointer'}
                      onClick={event => this.openAlbum(event, col.albumId)}
                    >
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
                      {col.thumbnailId ? (
                        <block-img photoId={col.thumbnailId} rotate={true} />
                      ) : (
                        <img
                          draggable={false}
                          src="/assets/placeholder-image.jpg"
                          onDragStart={event => this.preventDrag(event)}
                        />
                      )}
                      <ion-card-header>
                        <ion-card-subtitle>
                          {this.editMode ? (
                            <ion-item>
                              <ion-input
                                no-padding
                                type="text"
                                value={col.albumName}
                                onBlur={event =>
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
                        </ion-card-subtitle>
                      </ion-card-header>
                    </ion-card>
                  </ion-col>
                ))}
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
