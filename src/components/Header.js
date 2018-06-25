import React, { Component } from 'react';
import { Link } from 'react-router-dom';

class Header extends Component {

  render() {
    return (
      <ion-header>
        <ion-toolbar>
          <ion-title>Block Photos</ion-title>
          <ion-buttons slot="end">
            <Link to="/profile">
              <ion-button icon-end>
                <ion-icon name="person"></ion-icon>
              </ion-button>
            </Link>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
    );
  }

}

export default Header;
