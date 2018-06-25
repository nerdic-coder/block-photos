import React, { Component } from 'react';
import { isUserSignedIn } from 'blockstack';

import Header from '../components/Header.js';

export default class PictureList extends Component {

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <React.Fragment>
        <Header />
        <ion-content>
          <p>Pictures here</p>
        </ion-content>
      </React.Fragment>
    );
  }

  componentWillMount() {
    if (!isUserSignedIn()) {
      const { history } = this.props;
      history.replace('/');
      return;
    }
  }

}
