import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { isUserSignedIn, getFile } from 'blockstack';

export default class PictureList extends Component {

  constructor(props) {
    super(props);
  }

  async loadPicture(id) {
    let data = await getFile(id);
    return data;
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
            <img src={'data:image/png;base64,' + this.state.base64} />
        </ion-content>
      </React.Fragment>
    );
  }

  async componentWillMount() {
    
    // Init state
    this.setState({ base64: '' });

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

    // Load picture data
    const base64 = await this.loadPicture(this.props.match.params.id);
    this.setState({ base64: base64 });
  }

}
