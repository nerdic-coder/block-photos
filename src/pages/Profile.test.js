import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import Profile from './Profile';

import * as blockstack from 'blockstack';

jest.mock('blockstack');

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(
    <BrowserRouter>
      <Profile />
    </BrowserRouter>
    , div);
  ReactDOM.unmountComponentAtNode(div);
});

it('renders signed in without user data', () => {
  blockstack.isUserSignedIn.mockReturnValue(Promise.resolve(true));

  const div = document.createElement('div');
  ReactDOM.render(
    <BrowserRouter>
      <Profile />
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
      <Profile />
    </BrowserRouter>
    , div);
  ReactDOM.unmountComponentAtNode(div);
});
