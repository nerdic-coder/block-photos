import React, { Component } from 'react';
import PropTypes from 'prop-types';

import PictureService from '../services/PictureService.js';

class BlockImg extends Component {

  static propTypes = {
    id: PropTypes.any
  };

  state = {
    base64: '',
  };

  constructor(props) {
    super(props);

    this.pictureService = new PictureService();
    this.getPicture();
  }

  async getPicture() {
    const { id } = this.props;
    const base64 = await this.pictureService.loadPicture(id);
    this.setState({ base64: base64 });
    const ionSpinner = document.getElementById('spinner-' + id);
    const ionImg = document.getElementById('img-' + id);
    ionSpinner.style.visibility = 'hidden';
    ionImg.style.visibility = 'visible';
  }

  render() {
    return (
      <React.Fragment>
        <ion-spinner id={'spinner-' + this.props.id} name="circles" />
        <img id={'img-' + this.props.id} src={'data:image/png;base64,' + this.state.base64} style={{visibility: 'hidden', width: '100%', maxHeight: '100%'}} />
      </React.Fragment>
    );
  }

}

export default BlockImg;
