import React, { Component } from 'react';

import PictureService from '../services/PictureService.js';

class BlockImg extends Component {

  constructor(props) {
    super(props);

    this.pictureService = new PictureService();
  }

  render() {
    return (
      <ion-img src={'data:image/png;base64,' + this.state.base64} />
    );
  }

  componentWillMount() {
    console.log(this.props.id);
    this.setState({ base64: '' });

    this.getPicture();
  }

  async getPicture() {
    const base64 = await this.pictureService.loadPicture(this.props.id);
    this.setState({ base64: base64 });
  }
}

export default BlockImg;
