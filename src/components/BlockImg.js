import React, { Component } from 'react';
import PropTypes from 'prop-types';
import * as loadImage from 'blueimp-load-image';

import PhotosService from '../services/PhotosService';

export default class BlockImg extends Component {

  _isMounted = false;

  static propTypes = {
    id: PropTypes.any,
    rotate: PropTypes.bool,
    refresh: PropTypes.bool
  };

  state = {
    base64: '',
    isLoaded: false,
    rotation: 1
  };

  constructor(props) {
    super(props);

    this.photosService = new PhotosService();
  }

  componentDidMount() {
    this._isMounted = true;

    this.getPhoto();
  }

  componentDidUpdate(prevProps) {
    this._isMounted = true;

    if (this.props.id !== prevProps.id || this.props.refresh !== prevProps.refresh) {
      this.getPhoto();
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  async getPhoto() {
    const { id, rotate } = this.props;
    
    if (id === 'loading') {
      return;
    }
    
    const metadata = await this.photosService.getPhotoMetaData(id);

    const base64 = await this.photosService.loadPhoto(id);
    if (!this._isMounted) {
      return;
    }
    this.state.rotation = 1;
    if (metadata && metadata.stats && metadata.stats.exifdata 
      && metadata.stats.exifdata.tags.Orientation) {
        this.state.rotation = metadata.stats.exifdata.tags.Orientation;
        // Handle correct orientation for iOS
        if (this.iOS() && metadata.stats.exifdata.tags.OriginalOrientation) {
          const originalOrientation = metadata.stats.exifdata.tags.OriginalOrientation;
          // If the orientation is unchanged don't rotate at all with CSS, iOS handles it automatic
          if (this.state.rotation === originalOrientation) {
            this.state.rotation = 1;
          } else if (this.state.rotation === 1
            && originalOrientation === 6) {
              this.state.rotation = 8;
          } else if (this.state.rotation === 1) {
            this.state.rotation = originalOrientation;
          } else if (this.state.rotation === 3 
            && originalOrientation === 6) {
              this.state.rotation = 6;
          } else if (this.state.rotation === 8 
            && originalOrientation === 6) {
              this.state.rotation = 3;
          } else if (this.state.rotation === 3 
            && originalOrientation === 8) {
              this.state.rotation = 6;
          } else if (this.state.rotation === 6 
            && originalOrientation === 8) {
              this.state.rotation = 3;
          } else if (this.state.rotation === 8 
            && originalOrientation === 3) {
              this.state.rotation = 6;
          } else if (this.state.rotation === 6 
            && originalOrientation === 3) {
              this.state.rotation = 8;
          }
        }
    }

    // Set photo orientation from exif if it exist
    if (rotate && metadata && metadata.stats && metadata.stats.exifdata 
      && metadata.stats.exifdata.tags.Orientation && this.state.rotation !== 1) {
        const imageOptions = {};
        imageOptions.orientation = metadata.stats.exifdata.tags.Orientation;
        loadImage(base64, (processedPhoto) => {
          this.handleProcessedPhoto(processedPhoto);
        }, imageOptions);
    } else if (this._isMounted) {
      this.setState({ source: base64, isLoaded: true, rotation: this.state.rotation });
    }

  }

  handleProcessedPhoto(processedPhoto) {
    if (processedPhoto.type === "error") {
      // TODO: show error message
    } else if (processedPhoto.tagName === 'CANVAS' && this._isMounted) {
      this.setState({ source: processedPhoto.toDataURL(), isLoaded: true, rotation: this.state.rotation });
    } else if (this._isMounted) {
      this.setState({ source: processedPhoto.src, isLoaded: true, rotation: this.state.rotation });
    }
  }

  iOS() {

    var iDevices = [
      'iPad Simulator',
      'iPhone Simulator',
      'iPod Simulator',
      'iPad',
      'iPhone',
      'iPod'
    ];
  
    if (navigator.platform) {
      while (iDevices.length) {
        if (navigator.platform === iDevices.pop()){ return true; }
      }
    }
  
    return false;
  }

  render() {
    const { isLoaded, source, rotation } = this.state;
    if (isLoaded && source && this.props.id !== 'loading') {
      return (
        <img alt={this.props.id} draggable="false" src={source} className={ "rotation-" + rotation } />
      );
    } else {
      return (
        <ion-spinner name="circles" />
      );
    }
  }

}
