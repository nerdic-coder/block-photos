import React, { Component } from 'react';
import PropTypes from 'prop-types';

import PictureService from '../services/PictureService.js';

export default class BlockImg extends Component {

  static propTypes = {
    id: PropTypes.any
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
    if(this.props.id !== prevProps.id) {
      this.getPicture();
    }
  }

  async getPicture() {
    const { id } = this.props;
    const base64 = await this.pictureService.loadPicture(id);
    this.setState({ base64: base64, isLoaded: true });
  }

  render() {
    const isLoaded = this.state.isLoaded;
    if (isLoaded) {
      return (
        <img src={'data:image/png;base64,' + this.state.base64} className="center" style={{maxWidth: '100%', maxHeight: '100%'}} />
      );
    } else {
      return (
        <ion-spinner name="circles" />
      );
    }
  }

}
