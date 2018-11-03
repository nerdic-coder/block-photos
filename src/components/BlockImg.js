import React, { Component } from 'react';
import PropTypes from 'prop-types';
import * as loadImage from 'blueimp-load-image';

import PictureService from '../services/PictureService';

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

    this.pictureService = new PictureService();
  }

  componentDidMount() {
    this._isMounted = true;

    this.getPicture();
  }

  componentDidUpdate(prevProps) {
    this._isMounted = true;

    if (this.props.id !== prevProps.id || this.props.refresh !== prevProps.refresh) {
      this.getPicture();
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  async getPicture() {
    const { id, rotate } = this.props;
    
    if (id === 'loading') {
      return;
    }
    
    const metadata = await this.pictureService.getPictureMetaData(id);

    const base64 = await this.pictureService.loadPicture(id);
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
          console.log('ios');
          // If the orientation is unchanged don't rotate at all with CSS, iOS handles it automatic
          if (this.state.rotation === originalOrientation) {
            this.state.rotation = 1;
          } else if (this.state.rotation == 3 
            && originalOrientation == 1) {
              this.state.rotation = 3;
          } else if (this.state.rotation == 6 
            && originalOrientation == 1) {
              this.state.rotation = 6;
          } else if (this.state.rotation == 8 
            && originalOrientation == 1) {
              this.state.rotation = 8;
          } else if (this.state.rotation == 1 
            && originalOrientation == 3) {
              this.state.rotation = 3;
          } else if (this.state.rotation == 6 
            && originalOrientation == 3) {
              this.state.rotation = 6;
          } else if (this.state.rotation == 8 
            && originalOrientation == 3) {
              this.state.rotation = 8;
          } else if (this.state.rotation == 1 
            && originalOrientation == 6) {
              this.state.rotation = 6;
          } else if (this.state.rotation == 3 
            && originalOrientation == 6) {
              this.state.rotation = 8;
          } else if (this.state.rotation == 8 
            && originalOrientation == 6) {
              this.state.rotation = 3;
          } else if (this.state.rotation == 1 
            && originalOrientation == 8) {
              this.state.rotation = 8;
          } else if (this.state.rotation == 3 
            && originalOrientation == 8) {
              this.state.rotation = 6;
          } else if (this.state.rotation == 6 
            && originalOrientation == 8) {
              this.state.rotation = 3;
          }
        }
    }

    // Set picture orientation from exif if it exist
    if (rotate && metadata && metadata.stats && metadata.stats.exifdata 
      && metadata.stats.exifdata.tags.Orientation && metadata.stats.exifdata.tags.Orientation !== 1) {
        const imageOptions = {};
        imageOptions.orientation = metadata.stats.exifdata.tags.Orientation;
        loadImage(base64, (processedPicture) => {
          this.handleProcessedPicture(processedPicture);
        }, imageOptions);
    } else if (this._isMounted) {
      this.setState({ source: base64, isLoaded: true, rotation: this.state.rotation });
    }

  }

  handleProcessedPicture(processedPicture) {
    if (processedPicture.type === "error") {
      // TODO: show error message
    } else if (processedPicture.tagName == 'CANVAS' && this._isMounted) {
      this.setState({ source: processedPicture.toDataURL(), isLoaded: true, rotation: this.state.rotation });
    } else if (this._isMounted) {
      this.setState({ source: processedPicture.src, isLoaded: true, rotation: this.state.rotation });
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
        <img src={source} className={ "rotation-" + rotation } />
      );
    } else {
      return (
        <ion-spinner name="circles" />
      );
    }
  }

}
