import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import Photo from './Photo';

import * as blockstack from 'blockstack';
import UploadService from '../services/UploadService';

jest.mock('blockstack');
jest.mock('../services/UploadService');

beforeEach(() => {
  UploadService.mockClear();
  UploadService.mockImplementation(() => {
    return {
      addEventListeners: jest.fn(),
      removeEventListeners: jest.fn()
    };
  });
});

it('renders without crashing', () => {
  const mockResponse = 'base64mumbojumbo';
  blockstack.getFile.mockReturnValue(Promise.resolve(mockResponse));

  const div = document.createElement('div');
  ReactDOM.render(
    <BrowserRouter>
      <Photo match={{params: {}}} />
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
      <Photo match={{params: {}}} />
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
      <Photo match={{params: {id: 1 }}}  />
    </BrowserRouter>
    , div);
  ReactDOM.unmountComponentAtNode(div);
});
