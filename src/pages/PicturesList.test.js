import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import PicturesList from './PicturesList';

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
  const div = document.createElement('div');
  ReactDOM.render(
    <BrowserRouter>
      <PicturesList />
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
      <PicturesList />
    </BrowserRouter>
    , div);
  ReactDOM.unmountComponentAtNode(div);
});

it('renders with list', () => {
  const mockResponse = [{
    "id": 'test123.jpg',
    "uploadedDate": "2018-07-11T21:58:39.754Z"
  }];
  blockstack.getFile.mockReturnValue(Promise.resolve(JSON.stringify(mockResponse)));
  blockstack.isUserSignedIn.mockReturnValue(Promise.resolve(true));

  const div = document.createElement('div');
  ReactDOM.render(
    <BrowserRouter>
      <PicturesList />
    </BrowserRouter>
    , div);
  ReactDOM.unmountComponentAtNode(div);
});

it('renders with empty list', () => {
  const mockResponse = [];
  blockstack.getFile.mockReturnValue(Promise.resolve(JSON.stringify(mockResponse)));
  blockstack.isUserSignedIn.mockReturnValue(Promise.resolve(true));

  const div = document.createElement('div');
  ReactDOM.render(
    <BrowserRouter>
      <PicturesList />
    </BrowserRouter>
    , div);
  ReactDOM.unmountComponentAtNode(div);
});
