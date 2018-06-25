import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import {
  loadUserData,
  Person,
  signUserOut,
  isUserSignedIn
} from 'blockstack';

const avatarFallbackImage = 'https://s3.amazonaws.com/onename/avatar-placeholder.png';

export default class Profile extends Component {

  constructor(props) {
    super(props);

    this.state = {
      person: {
        name() {
          return 'Anonymous';
        },
        avatarUrl() {
          return avatarFallbackImage;
        },
      },
    };
  }

  handleSignOut(e) {
    e.preventDefault();
    signUserOut();
    const { history } = this.props;
    history.replace('/');
  }

  render() {
    const { person } = this.state;
    return (
      <React.Fragment>
        <ion-header>
          <ion-toolbar>
            <ion-buttons slot="start">
              <Link to="/">
                <ion-back-button default-href="/"></ion-back-button>
              </Link>
            </ion-buttons>
            <ion-title>Blockstack Profile</ion-title>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <ion-card>
            <img src={person.avatarUrl() ? person.avatarUrl() : avatarFallbackImage} className="img-rounded avatar" id="avatar-image" />

            <ion-card-content>
              <ion-card-title>Hello, {person.name() ? person.name() : 'Nameless Person'}!</ion-card-title>
              <p>
                <ion-button expand="block"
                  id="signout-button"
                  onClick={(event) => this.handleSignOut(event)}
                >
                  Logout
            </ion-button>
              </p>
            </ion-card-content>
          </ion-card>
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
    this.setState({
      person: new Person(loadUserData().profile),
    });
  }
}
