import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';

import UploadService from './services/UploadService';

import App from './App';

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
    <App />
  </BrowserRouter>, div);
  ReactDOM.unmountComponentAtNode(div);
});
