import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { shallow } from 'enzyme';

import * as blockstack from 'blockstack';

import UploadService from '../services/UploadService';

import Profile from './Profile';

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

it('test signout method', async () => {
  const mockResponse = {
    "profile": {
       avatarUrl: 'https://placekitten.com/200/300', name: 'Johan Axelsson' 
    }
  };
  blockstack.loadUserData.mockReturnValue(Promise.resolve(JSON.stringify(mockResponse)));
  blockstack.isUserSignedIn.mockReturnValue(Promise.resolve(true));

  const wrapper = shallow(<Profile />);
  await wrapper.instance().componentDidMount();
  const profileHeader = "Blockstack Profile";
  expect(wrapper.contains(profileHeader)).toEqual(true);
  wrapper.instance().handleSignOut(null);
});
