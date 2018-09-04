import React, { Component } from 'react';
import PropTypes from 'prop-types';
import * as loadImage from 'blueimp-load-image';

import PictureService from '../services/PictureService.js';

export default class BlockImg extends Component {

  static propTypes = {
    id: PropTypes.any,
    aspectRatio: PropTypes.any
  };

  state = {
    base64: '',
    isLoaded: false
  };

  constructor(props) {
    super(props);

    this.pictureService = new PictureService();
  }

  componentDidMount() {
    this.getPicture();
  }

  componentDidUpdate(prevProps) {
    if (this.props.id !== prevProps.id) {
      this.getPicture();
    }
  }

  async getPicture() {
    const { id, aspectRatio } = this.props;
    const metadata = await this.pictureService.getPictureMetaData(id);

    const base64 = await this.pictureService.loadPicture(id);
    const imageOptions = {};

    // Set picture orientation from exif if it exist
    if (metadata && metadata.stats && metadata.stats.exifdata && metadata.stats.exifdata.tags.Orientation) {
      imageOptions.orientation = metadata.stats.exifdata.tags.Orientation;
    }

    if (aspectRatio) {
      imageOptions.aspectRatio = aspectRatio;
    }

    if (imageOptions) {
      loadImage('data:image/png;base64,' + base64, (img) => {
        this.handleProcessedPicture(img);
      }, imageOptions);
    } else {
      this.setState({ source: 'data:image/png;base64,' + base64, isLoaded: true });
    }
  }

  handleProcessedPicture(img) {
    if (img.type === "error") {
      // TODO: show error message
    } else if (img.tagName == 'CANVAS') {
      this.setState({ source: img.toDataURL(), isLoaded: true });
    } else {
      this.setState({ source: img.src, isLoaded: true });
    }
  }

  render() {
    const { isLoaded, source } = this.state;
    if (isLoaded && source) {
      return (
        <img src={source} className="center" style={{ maxWidth: '100%', maxHeight: '100%' }} />
      );
    } else {
      return (
        <ion-spinner name="circles" />
      );
    }
  }

}
