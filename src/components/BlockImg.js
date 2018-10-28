import React, { Component } from 'react';
import PropTypes from 'prop-types';
import * as loadImage from 'blueimp-load-image';

import PictureService from '../services/PictureService';

export default class BlockImg extends Component {

  _isMounted = false;

  static propTypes = {
    id: PropTypes.any,
    rotate: PropTypes.bool
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

    if (this.props.id !== prevProps.id) {
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
