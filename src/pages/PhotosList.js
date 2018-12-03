import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { ModalRoute } from 'react-router-modal';

import { isUserSignedIn } from 'blockstack';
import _ from 'lodash';

import PhotosService from '../services/PhotosService';
import PresentingService from '../services/PresentingService';
import UploadService from '../services/UploadService';
import BlockImg from '../components/BlockImg';

import Photo from './Photo';

export default class PhotosList extends Component {

  _isMounted = false;
  timer;
  lockTimer;
  // length of time we want the user to touch before we do something
  touchduration = 800;
  
  static propTypes = {
    history: PropTypes.any,
    match: PropTypes.any
  };

  state = {
    photosList: [],
    refreshPhoto: [],
    listLoaded: false,
    editMode: false,
    checkedItems: []
  };

  constructor(props) {
    super(props);

    this.photosService = new PhotosService();
    this.present = new PresentingService();
    this.uploadService = new UploadService(this.uploadFilesDoneCallback.bind(this));
    this.photosRangeListener = this.loadPhotosRange.bind(this);
    this.photosRefresherListener = this.refreshPhotosList.bind(this);

    // Go to signin page if no active session exist
    if (!isUserSignedIn()) {
      const { history } = this.props;
      if (history) {
        history.replace('/');
      }
      return;
    }
  }

  componentDidMount() {
    this._isMounted = true;
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

    if (window.gtag) {
      window.gtag('event', 'photos-list');
    }
  }

  componentWillUnmount() {
    this._isMounted = false;

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

  async loadPhotosList(sync, skipLoading) {
    try {
      if (!skipLoading) {
        await this.present.loading('Loading photos...');
      }

      // Get the contents of the file picture-list.json
      let photosListResponse = await this.photosService.getPhotosList(sync);
      this.photosListCached = photosListResponse.photosList;
      if (!skipLoading) {
        this.present.dismissLoading();
      }

      this.loadPhotosRange();
      
      if (photosListResponse.errorsList && photosListResponse.errorsList.length > 0) {
        for (let error in photosListResponse.errorsList) {
          if (error.errorCode === 'err_cache') {
            this.present.toast('Failed to load cached list. Please try again!');
          } else if (error.errorCode) {
            this.present.toast('Could not load photos from blockstack. Please try again or upload some photos if you have none!');
          }
        }
      }

    } catch (error) {
      if (!skipLoading) {
        this.present.dismissLoading();
      }
      this.present.toast('Could not load photos. Please try again!');
      this.refresherScroll.complete();
    }
  }

  loadPhotosRange(event) {
    setTimeout(() => {
      if (event) {
        this.infiniteScroll.complete();
      }
      this.refresherScroll.complete();
      if (this._isMounted) {
        const photosToLoad = this.photosLoaded + 18;
        if (photosToLoad > this.photosListCached.length) {
          this.setState({ editMode: false, photosList: this.photosListCached, listLoaded: true });
          if (event) {
            this.infiniteScroll.disabled = true;
          }
        } else {
          const photosList = this.photosListCached.slice(0, photosToLoad);
          this.setState({ editMode: false, photosList: photosList, listLoaded: true });
          this.photosLoaded = photosToLoad;
        }
      }
    }, 500);
  }

  async rotatePhotos() {
    let tempRefreshPhoto = this.state.refreshPhoto;
    for (let id of this.state.checkedItems) {
      await this.photosService.rotatePhoto(id);
      
      if (tempRefreshPhoto[id]) {
        tempRefreshPhoto[id] = false;
      } else {
        tempRefreshPhoto[id] = true;
      }
    }

    if (this._isMounted) {
      this.setState({refreshPhoto: tempRefreshPhoto});
    }

    if (window.gtag) {
      window.gtag('event', 'photos-list-rotate');
    }
  }

  uploadFilesDoneCallback() {
    this.loadPhotosList();

    if (window.gtag) {
      window.gtag('event', 'photos-list-uploaded');
    }
  }

  deletePhotoCallback(callbackComponent) {
    callbackComponent.loadPhotosList();

    if (window.gtag) {
      window.gtag('event', 'photos-list-deleted');
    }
  }

  refreshPhoto(id) {
    let tempRefreshPhoto = this.state.refreshPhoto;
    if (tempRefreshPhoto[id]) {
      tempRefreshPhoto[id] = false;
    } else {
      tempRefreshPhoto[id] = true;
    }
    this.setState({refreshPhoto: tempRefreshPhoto});
  }

  openFileDialog(event) {
    if (event) {
      event.preventDefault();
    }
    document.getElementById('file-upload').click();

    if (window.gtag) {
      window.gtag('event', 'photos-list-file-dialog');
    }
  }

  updateCallback(id) {
    if (id) {
      setTimeout(() => {
        if (this._isMounted) {
          this.refreshPhoto(id);
        }
      }, 1500);
    } else {
      setTimeout(() => {
        if (this._isMounted) {
          this.loadPhotosList(true, true);
        }
      }, 1500);
    }
  }

  activateEditor(event, id) {
    if (event) {
      event.preventDefault();
    }
    if (this._isMounted) {
      if (id) {
        this.setState({editMode: true, checkedItems: [id]});
      } else {
        this.setState({editMode: true, checkedItems: []});
      }
    }
  }

  deactivateEditor() {
    if (this._isMounted) {
      this.setState({editMode: false, checkedItems: []});
    }
  }

  handlePhotoClick(event, id) {
    if (this.state.editMode) {
      event.preventDefault();

      const tempItems = this.state.checkedItems;

      if (this.state.checkedItems.includes(id)) {
        var index = this.state.checkedItems.indexOf(id);
        if (index > -1) {
          tempItems.splice(index, 1);
        }
      } else {
        tempItems.push(id);
      }

      if (this._isMounted) {
        if (tempItems.length > 0) {
          this.setState({checkedItems: tempItems});
        } else {
          this.setState({editMode: false, checkedItems: tempItems});
        }
      }
    }
  }

  isChecked(id) {
    if (this.state.checkedItems.includes(id)) {
      return true;
    } else {
      return false;
    }
  }

  touchStart(event, id) {
    event.preventDefault();
    if (this.lockTimer) {
      return;
    }
    this.timer = setTimeout(() => {
      this.activateEditor(null, id);
    }, this.touchduration); 
    this.lockTimer = true;
  }

  touchEnd() {
    // stops short touches from firing the event
    if (this.timer){
      clearTimeout(this.timer); // clearTimeout, not cleartimeout..
      this.lockTimer = false;
    }
  }

  render() {
    const { match } = this.props;
    let rows = [];
    let empty = true;
    if (this.state.photosList && this.state.photosList.length > 0) {
      rows = _.chunk(this.state.photosList, 3);
      empty = false;
    }

    return (
      <React.Fragment>
        <ion-header>
          <ion-toolbar mode="md" color="primary">
            <ion-title class="unselectable">Block Photos</ion-title>
            <ion-buttons slot="end">
              {this.state.editMode ? (
                <React.Fragment>
                  <ion-button onClick={() => this.rotatePhotos()}>
                    <ion-icon color="light" name="sync"></ion-icon>
                  </ion-button>
                  <ion-button onClick={() => this.present.deletePhotos(this.state.checkedItems, this)}>
                    <ion-icon color="light" name="trash"></ion-icon>
                  </ion-button>
                  <ion-button onClick={() => this.deactivateEditor()}>
                    <ion-icon color="light" name="close"></ion-icon>
                  </ion-button>
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <Link to="/profile" draggable="false">
                    <ion-button>
                      <ion-icon color="light" name="person"></ion-icon>
                    </ion-button>
                  </Link>
                  <ion-button onClick={() => this.loadPhotosList(true)}>
                    <ion-icon name="refresh"></ion-icon>
                  </ion-button>
                  <ion-button onClick={(event) =>  this.activateEditor(event, null)}>
                    <ion-icon name="checkmark-circle"></ion-icon>
                  </ion-button>
                  <ion-button onClick={(event) => this.openFileDialog(event)}>
                    <ion-icon name="cloud-upload"></ion-icon>
                  </ion-button>
                  <input id="file-upload" type="file" multiple />
                </React.Fragment>
              )}
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content id="photos-list">
          <ion-refresher slot="fixed" id="refresher-scroll">
            <ion-refresher-content></ion-refresher-content>
          </ion-refresher>
          {empty && this.state.listLoaded ? ( <ion-card padding text-center><h2>Welcome to Block Photos.</h2><h3>Use the upload button (<ion-icon size="small" name="ios-cloud-upload"></ion-icon>) to add your first photo.</h3></ion-card> ) : (
          <ion-grid no-padding>
            {rows.map((row) => (
              <ion-row align-items-center key={row[0].id}>
                {
                  row.map((col) => (
                    <ion-col no-padding align-self-center key={col.id}>
                      <Link to={`${match.url}/photo/` + col.id} 
                        onTouchStart={(event) => this.touchStart(event, col.id)} 
                        onTouchEnd={(event) => this.touchEnd(event)} 
                        onClick={(event) => this.handlePhotoClick(event, col.id)}>
                      <div className="square" onContextMenu={(event) => this.activateEditor(event, col.id)}>
                        {this.state.editMode ? (<ion-checkbox checked={this.isChecked(col.id)} mode="ios"></ion-checkbox>) : ( null )}
                        <BlockImg id={col.id} refresh={this.state.refreshPhoto[col.id]} />
                      </div>
                      </Link>
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
        </ion-content>
        <ModalRoute path="*/photo/:id" component={Photo} props={{ updateCallback: this.updateCallback.bind(this) }} />
      </React.Fragment>
    );
  }
}
