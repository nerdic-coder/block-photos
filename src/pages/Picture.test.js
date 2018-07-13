import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import Picture from './Picture';

import * as blockstack from 'blockstack';

jest.mock('blockstack');

it('renders without crashing', () => {
  const mockResponse = 'base64mumbojumbo';
  blockstack.getFile.mockReturnValue(Promise.resolve(mockResponse));

  const div = document.createElement('div');
  ReactDOM.render(
    <BrowserRouter>
      <Picture />
    </BrowserRouter>
    , div);
  ReactDOM.unmountComponentAtNode(div);
});

it('renders signed in', () => {
  const mockResponse = 'base64mumbojumbo';
  blockstack.getFile.mockReturnValue(Promise.resolve(mockResponse));
  blockstack.isUserSignedIn.mockReturnValue(Promise.resolve(true));

  const div = document.createElement('div');
  ReactDOM.render(
    <BrowserRouter>
      <Picture />
    </BrowserRouter>
    , div);
  ReactDOM.unmountComponentAtNode(div);
});

it('renders with id', () => {
  const mockResponse = 'base64mumbojumbo';
  blockstack.getFile.mockReturnValue(Promise.resolve(mockResponse));
  blockstack.isUserSignedIn.mockReturnValue(Promise.resolve(true));

  const div = document.createElement('div');
  ReactDOM.render(
    <BrowserRouter>
      <Picture match={{params: {id: 1 }}}  />
    </BrowserRouter>
    , div);
  ReactDOM.unmountComponentAtNode(div);
});
