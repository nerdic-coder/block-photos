import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';

import UploadService from './services/UploadService';

import MainApp from './MainApp';

jest.mock('blockstack', () => ({
  isUserSignedIn: () => ({})
}));
jest.mock('./services/UploadService');

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
  ReactDOM.render(<BrowserRouter>
    <MainApp />
  </BrowserRouter>, div);
  ReactDOM.unmountComponentAtNode(div);
});
