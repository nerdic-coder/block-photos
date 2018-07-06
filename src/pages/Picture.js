import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { isUserSignedIn } from 'blockstack';

import BlockImg from '../components/BlockImg.js';

export default class PicturesList extends Component {

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <React.Fragment>
        <ion-header>
          <ion-toolbar>
            <ion-buttons slot="start">
              <Link to="/pictures">
                <ion-back-button default-href="/pictures"></ion-back-button>
              </Link>
            </ion-buttons>
            <ion-title>Block Photo</ion-title>
          </ion-toolbar>
        </ion-header>

        <ion-content text-center class="picture-background">
          <BlockImg id={this.props.match.params.id} />
        </ion-content>
      </React.Fragment>
    );
  }

  componentWillMount() {

    // Go to signin page if no active session exist
    if (!isUserSignedIn()) {
      const { history } = this.props;
      history.replace('/');
      return;
    }

    // Go to pictures list if picture id is missing
    if (!this.props.match.params.id) {
      const { history } = this.props;
      history.replace('/pictures');
      return;
    }

  }

}
