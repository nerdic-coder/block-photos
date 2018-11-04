import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import * as blockstack from 'blockstack';
import * as capacitor from '@capacitor/core';

import Signin from './Signin';

jest.mock('blockstack');
jest.mock('@capacitor/core');

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(
    <BrowserRouter>
      <Signin />
    </BrowserRouter>
    , div);
  ReactDOM.unmountComponentAtNode(div);
});

it('renders signed in without user data', () => {
  blockstack.isUserSignedIn.mockReturnValue(Promise.resolve(true));

  const div = document.createElement('div');
  ReactDOM.render(
    <BrowserRouter>
      <Signin />
    </BrowserRouter>
    , div);
  ReactDOM.unmountComponentAtNode(div);
});

it('renders signed in with user data', () => {
  const mockResponse = {
    "profile": {
       avatarUrl: 'https://placekitten.com/200/300', name: 'Johan Axelsson' 
    }
  };
  blockstack.loadUserData.mockReturnValue(Promise.resolve(JSON.stringify(mockResponse)));
  blockstack.isUserSignedIn.mockReturnValue(Promise.resolve(true));

  const div = document.createElement('div');
  ReactDOM.render(
    <BrowserRouter>
      <Signin />
    </BrowserRouter>
    , div);
  ReactDOM.unmountComponentAtNode(div);
});
